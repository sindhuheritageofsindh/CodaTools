from __future__ import annotations

from io import BytesIO
from pathlib import Path
import zipfile

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from PIL import Image
import pypdfium2 as pdfium
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas as reportlab_canvas

from seo_server import TOOLS, render_index, sitemap_xml

from pdf_utils import (
    MAX_RESPONSE,
    ensure_upload_size,
    parse_page_spec,
    parse_render_pages,
    pdf_bytes,
    readable_pdf,
    safe_stem,
    split_all_zip,
)

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "frontend" / "dist"

app = FastAPI(title="CodaTools", docs_url=None, redoc_url=None)


def error(status: int, message: str) -> JSONResponse:
    return JSONResponse({"error": message}, status_code=status, headers={"Cache-Control": "no-store"})


async def read_upload(file: UploadFile) -> bytes:
    data = await file.read()
    ensure_upload_size(data)
    return data


def attachment(data: bytes, media_type: str, filename: str, extra_headers: dict[str, str] | None = None) -> Response:
    if len(data) > MAX_RESPONSE:
        return error(413, "Generated output is too large for this deployment. Try fewer pages or lower quality.")
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Cache-Control": "no-store",
    }
    if extra_headers:
        headers.update(extra_headers)
    return Response(data, media_type=media_type, headers=headers)


@app.get("/api/health")
def health():
    return {"ok": True, "service": "codatools", "version": "3.0", "backendTools": 8}


@app.post("/api/merge-pdf")
async def merge_pdf(files: list[UploadFile] = File(...)):
    try:
        if len(files) < 2:
            raise ValueError("Choose at least two PDF files.")
        writer = PdfWriter()
        total = 0
        for file in files:
            data = await read_upload(file)
            reader = readable_pdf(data)
            for page in reader.pages:
                writer.add_page(page)
                total += 1
        if not total:
            raise ValueError("The selected PDFs contain no pages.")
        return attachment(pdf_bytes(writer), "application/pdf", "codatools-merged.pdf")
    except OverflowError as exc:
        return error(413, str(exc))
    except ValueError as exc:
        return error(400, str(exc))
    except Exception:
        return error(500, "Could not merge these PDFs.")


@app.post("/api/split-pdf")
async def split_pdf(
    file: UploadFile = File(...),
    mode: str = Form("range"),
    pages: str = Form("1"),
):
    try:
        data = await read_upload(file)
        reader = readable_pdf(data)
        base = safe_stem(file.filename or "document.pdf")
        if mode == "all":
            output = split_all_zip(data, file.filename or "document.pdf")
            return attachment(output, "application/zip", f"{base}-pages.zip")
        chosen = parse_page_spec(pages, len(reader.pages))
        writer = PdfWriter()
        for n in chosen:
            writer.add_page(reader.pages[n - 1])
        return attachment(pdf_bytes(writer), "application/pdf", f"{base}-selected-pages.pdf")
    except OverflowError as exc:
        return error(413, str(exc))
    except ValueError as exc:
        return error(400, str(exc))
    except Exception:
        return error(500, "Could not split this PDF.")


@app.post("/api/compress-pdf")
async def compress_pdf(file: UploadFile = File(...)):
    try:
        data = await read_upload(file)
        reader = readable_pdf(data)
        writer = PdfWriter()
        writer.clone_document_from_reader(reader)
        for page in writer.pages:
            page.compress_content_streams(level=9)
        writer.compress_identical_objects(remove_identicals=True, remove_orphans=True)
        output = pdf_bytes(writer)
        if not output or len(output) >= len(data):
            output = data
        base = safe_stem(file.filename or "document.pdf")
        return attachment(
            output,
            "application/pdf",
            f"{base}-compressed.pdf",
            {"X-Coda-Original-Size": str(len(data)), "X-Coda-Output-Size": str(len(output))},
        )
    except OverflowError as exc:
        return error(413, str(exc))
    except ValueError as exc:
        return error(400, str(exc))
    except Exception:
        return error(500, "Could not compress this PDF.")


def render_jpg(pdf: pdfium.PdfDocument, page_number: int, dpi: int, quality: int) -> bytes:
    page = pdf[page_number - 1]
    bitmap = page.render(scale=dpi / 72.0)
    image = bitmap.to_pil()
    if image.mode != "RGB":
        bg = Image.new("RGB", image.size, "white")
        if "A" in image.getbands():
            bg.paste(image, mask=image.getchannel("A"))
        else:
            bg.paste(image.convert("RGB"))
        image = bg
    out = BytesIO()
    image.save(out, format="JPEG", quality=quality, optimize=True)
    page.close()
    return out.getvalue()


@app.post("/api/pdf-to-jpg")
async def pdf_to_jpg(
    file: UploadFile = File(...),
    pages: str = Form("1"),
    dpi: int = Form(120),
    quality: int = Form(86),
):
    try:
        data = await read_upload(file)
        dpi = max(72, min(180, int(dpi)))
        quality = max(55, min(95, int(quality)))
        try:
            pdf = pdfium.PdfDocument(data)
        except Exception as exc:
            raise ValueError("This PDF is invalid, damaged, or password protected.") from exc
        count = len(pdf)
        chosen = parse_render_pages(pages, count)
        base = safe_stem(file.filename or "document.pdf")
        if len(chosen) == 1:
            output = render_jpg(pdf, chosen[0], dpi, quality)
            pdf.close()
            return attachment(output, "image/jpeg", f"{base}-page-{chosen[0]}.jpg")
        out = BytesIO()
        with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for n in chosen:
                zf.writestr(f"{base}-page-{n}.jpg", render_jpg(pdf, n, dpi, quality))
        pdf.close()
        return attachment(out.getvalue(), "application/zip", f"{base}-jpg-pages.zip")
    except OverflowError as exc:
        return error(413, str(exc))
    except ValueError as exc:
        return error(400, str(exc))
    except Exception:
        return error(500, "Could not convert this PDF to JPG.")


@app.post("/api/rotate-pdf")
async def rotate_pdf(
    file: UploadFile = File(...),
    pages: str = Form("1"),
    angle: int = Form(90),
):
    try:
        data = await read_upload(file)
        reader = readable_pdf(data)
        if angle not in (90, 180, 270):
            raise ValueError("Rotation must be 90, 180, or 270 degrees.")
        chosen = set(parse_page_spec(pages, len(reader.pages)))
        writer = PdfWriter()
        for i, page in enumerate(reader.pages, 1):
            if i in chosen:
                page.rotate(angle)
            writer.add_page(page)
        base = safe_stem(file.filename or "document.pdf")
        return attachment(pdf_bytes(writer), "application/pdf", f"{base}-rotated.pdf")
    except OverflowError as exc:
        return error(413, str(exc))
    except ValueError as exc:
        return error(400, str(exc))
    except Exception:
        return error(500, "Could not rotate this PDF.")


@app.post("/api/reorder-pdf")
async def reorder_pdf(file: UploadFile = File(...), order: str = Form(...)):
    try:
        data = await read_upload(file)
        reader = readable_pdf(data)
        chosen = parse_page_spec(order, len(reader.pages), preserve_order=True)
        expected = list(range(1, len(reader.pages) + 1))
        if len(chosen) != len(expected) or sorted(chosen) != expected:
            raise ValueError(f"Order must include every page exactly once (1-{len(reader.pages)}).")
        writer = PdfWriter()
        for n in chosen:
            writer.add_page(reader.pages[n - 1])
        base = safe_stem(file.filename or "document.pdf")
        return attachment(pdf_bytes(writer), "application/pdf", f"{base}-reordered.pdf")
    except OverflowError as exc:
        return error(413, str(exc))
    except ValueError as exc:
        return error(400, str(exc))
    except Exception:
        return error(500, "Could not reorder this PDF.")


@app.post("/api/delete-pdf-pages")
async def delete_pdf_pages(file: UploadFile = File(...), pages: str = Form(...)):
    try:
        data = await read_upload(file)
        reader = readable_pdf(data)
        deleted = set(parse_page_spec(pages, len(reader.pages)))
        if len(deleted) >= len(reader.pages):
            raise ValueError("At least one page must remain in the PDF.")
        writer = PdfWriter()
        for i, page in enumerate(reader.pages, 1):
            if i not in deleted:
                writer.add_page(page)
        base = safe_stem(file.filename or "document.pdf")
        return attachment(pdf_bytes(writer), "application/pdf", f"{base}-pages-removed.pdf")
    except OverflowError as exc:
        return error(413, str(exc))
    except ValueError as exc:
        return error(400, str(exc))
    except Exception:
        return error(500, "Could not delete pages from this PDF.")


def watermark_page(width: float, height: float, text: str, font_size: int, opacity: float, rotation: int) -> PdfReader:
    stream = BytesIO()
    c = reportlab_canvas.Canvas(stream, pagesize=(width, height))
    try:
        c.setFillAlpha(opacity)
    except Exception:
        pass
    c.setFont("Helvetica-Bold", font_size)
    c.setFillColorRGB(0.25, 0.25, 0.25)
    c.saveState()
    c.translate(width / 2, height / 2)
    c.rotate(rotation)
    c.drawCentredString(0, -font_size / 3, text)
    c.restoreState()
    c.save()
    stream.seek(0)
    return PdfReader(stream)


@app.post("/api/watermark-pdf")
async def watermark_pdf(
    file: UploadFile = File(...),
    text: str = Form(...),
    font_size: int = Form(42),
    opacity: float = Form(0.22),
    rotation: int = Form(45),
):
    try:
        data = await read_upload(file)
        text = text.strip()
        if not text:
            raise ValueError("Enter watermark text.")
        if len(text) > 80:
            raise ValueError("Keep watermark text under 80 characters.")
        font_size = max(12, min(120, int(font_size)))
        opacity = max(0.05, min(0.8, float(opacity)))
        rotation = max(-90, min(90, int(rotation)))
        reader = readable_pdf(data)
        writer = PdfWriter()
        for page in reader.pages:
            width = float(page.mediabox.width)
            height = float(page.mediabox.height)
            mark = watermark_page(width, height, text, font_size, opacity, rotation)
            page.merge_page(mark.pages[0])
            writer.add_page(page)
        base = safe_stem(file.filename or "document.pdf")
        return attachment(pdf_bytes(writer), "application/pdf", f"{base}-watermarked.pdf")
    except OverflowError as exc:
        return error(413, str(exc))
    except ValueError as exc:
        return error(400, str(exc))
    except Exception:
        return error(500, "Could not watermark this PDF.")


@app.get("/api/info")
def api_info():
    return {
        "name": "CodaTools",
        "frontend": "React + Vite",
        "backend": "FastAPI",
        "privacy": "Most image, QR, text, and developer tools run locally in your browser.",
    }


@app.get("/robots.txt", response_class=Response)
def robots(request):
    origin = str(request.base_url).rstrip("/")
    body = f"User-agent: *\\nAllow: /\\nDisallow: /api/\\nSitemap: {origin}/sitemap.xml\\n"
    return Response(body, media_type="text/plain; charset=utf-8")


@app.get("/sitemap.xml", response_class=Response)
def sitemap(request):
    return Response(sitemap_xml(str(request.base_url)), media_type="application/xml; charset=utf-8")


if DIST.exists():
    assets = DIST / "assets"
    if assets.exists():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    @app.get("/tools/{slug}", response_class=HTMLResponse)
    def tool_page(slug: str, request):
        if slug not in TOOLS:
            return HTMLResponse("Tool not found", status_code=404)
        return HTMLResponse(render_index(DIST / "index.html", str(request.base_url), slug))

    @app.get("/", response_class=HTMLResponse)
    def home_page(request):
        return HTMLResponse(render_index(DIST / "index.html", str(request.base_url)))

    @app.get("/{path:path}", response_class=HTMLResponse)
    def spa_fallback(path: str, request):
        return HTMLResponse(render_index(DIST / "index.html", str(request.base_url)))
else:
    @app.get("/")
    def root_not_built():
        return JSONResponse({
            "ok": True,
            "message": "CodaTools FastAPI is running. Start Vite for development or run npm run build for production."
        })
