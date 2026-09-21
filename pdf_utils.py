from __future__ import annotations

from io import BytesIO
from pathlib import Path
import re
import zipfile

from pypdf import PdfReader, PdfWriter

MAX_UPLOAD = 4 * 1024 * 1024
MAX_RESPONSE = 4 * 1024 * 1024
MAX_RENDER_PAGES = 30


def safe_stem(name: str) -> str:
    value = Path(name or "document").stem
    value = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-.")
    return value[:80] or "document"


def readable_pdf(data: bytes) -> PdfReader:
    try:
        reader = PdfReader(BytesIO(data), strict=False)
    except Exception as exc:
        raise ValueError("The PDF is invalid or damaged.") from exc
    if reader.is_encrypted:
        try:
            unlocked = reader.decrypt("")
        except Exception as exc:
            raise ValueError("Password-protected PDFs are not supported.") from exc
        if not unlocked:
            raise ValueError("Password-protected PDFs are not supported.")
    if len(reader.pages) < 1:
        raise ValueError("The PDF does not contain any pages.")
    return reader


def ensure_upload_size(data: bytes) -> None:
    if not data:
        raise ValueError("No file data was received.")
    if len(data) > MAX_UPLOAD:
        raise OverflowError("File is too large for this deployment. Keep each PDF under 4 MB.")


def parse_page_spec(spec: str, page_count: int, *, preserve_order: bool = False) -> list[int]:
    raw_spec = (spec or "").strip()
    if not raw_spec:
        raise ValueError("Enter at least one page number.")

    pages: list[int] = []
    seen: set[int] = set()
    for raw in raw_spec.split(","):
        part = raw.strip()
        if not part:
            continue
        if "-" in part:
            bits = part.split("-", 1)
            try:
                a, b = int(bits[0]), int(bits[1])
            except ValueError as exc:
                raise ValueError("Invalid page range. Try 1-3, 5.") from exc
            step = 1 if b >= a else -1
            numbers = range(a, b + step, step)
        else:
            try:
                numbers = [int(part)]
            except ValueError as exc:
                raise ValueError("Invalid page number.") from exc
        for n in numbers:
            if n < 1 or n > page_count:
                raise ValueError(f"Use page numbers from 1 to {page_count}.")
            if preserve_order:
                pages.append(n)
            elif n not in seen:
                pages.append(n)
                seen.add(n)

    if not pages:
        raise ValueError("Enter at least one page number.")
    return pages


def parse_render_pages(spec: str, page_count: int) -> list[int]:
    value = (spec or "1").strip().lower()
    if value == "all":
        pages = list(range(1, page_count + 1))
    else:
        pages = parse_page_spec(value, page_count)
    if len(pages) > MAX_RENDER_PAGES:
        raise ValueError(f"Convert up to {MAX_RENDER_PAGES} pages at a time.")
    return pages


def pdf_bytes(writer: PdfWriter) -> bytes:
    out = BytesIO()
    writer.write(out)
    return out.getvalue()


def split_all_zip(data: bytes, source_name: str) -> bytes:
    reader = readable_pdf(data)
    base = safe_stem(source_name)
    out = BytesIO()
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for i, page in enumerate(reader.pages, 1):
            writer = PdfWriter()
            writer.add_page(page)
            zf.writestr(f"{base}-page-{i}.pdf", pdf_bytes(writer))
    return out.getvalue()
