from io import BytesIO
import zipfile

from fastapi.testclient import TestClient
from pypdf import PdfReader
from reportlab.pdfgen import canvas

from app import app


def make_pdf(pages: int) -> bytes:
    out = BytesIO()
    c = canvas.Canvas(out)
    for i in range(pages):
        c.drawString(72, 720, f"Page {i + 1}")
        c.showPage()
    c.save()
    return out.getvalue()


def test_pdf_endpoints():
    client = TestClient(app)
    two = make_pdf(2)
    three = make_pdf(3)

    assert client.get("/api/health").status_code == 200

    r = client.post("/api/merge-pdf", files=[
        ("files", ("a.pdf", two, "application/pdf")),
        ("files", ("b.pdf", three, "application/pdf")),
    ])
    assert r.status_code == 200
    assert len(PdfReader(BytesIO(r.content)).pages) == 5

    r = client.post("/api/split-pdf", files={"file": ("b.pdf", three, "application/pdf")}, data={"mode": "range", "pages": "2-3"})
    assert r.status_code == 200
    assert len(PdfReader(BytesIO(r.content)).pages) == 2

    r = client.post("/api/split-pdf", files={"file": ("b.pdf", three, "application/pdf")}, data={"mode": "all", "pages": "1"})
    assert r.status_code == 200
    with zipfile.ZipFile(BytesIO(r.content)) as zf:
        assert len(zf.namelist()) == 3

    r = client.post("/api/compress-pdf", files={"file": ("b.pdf", three, "application/pdf")})
    assert r.status_code == 200

    r = client.post("/api/pdf-to-jpg", files={"file": ("b.pdf", three, "application/pdf")}, data={"pages": "1", "dpi": "96", "quality": "80"})
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/jpeg")

    r = client.post("/api/rotate-pdf", files={"file": ("b.pdf", three, "application/pdf")}, data={"pages": "1,3", "angle": "90"})
    assert r.status_code == 200

    r = client.post("/api/reorder-pdf", files={"file": ("b.pdf", three, "application/pdf")}, data={"order": "3,1,2"})
    assert r.status_code == 200

    r = client.post("/api/delete-pdf-pages", files={"file": ("b.pdf", three, "application/pdf")}, data={"pages": "2"})
    assert r.status_code == 200
    assert len(PdfReader(BytesIO(r.content)).pages) == 2

    r = client.post("/api/watermark-pdf", files={"file": ("b.pdf", three, "application/pdf")}, data={"text": "TEST", "font_size": "36", "opacity": "0.2", "rotation": "45"})
    assert r.status_code == 200
    assert len(PdfReader(BytesIO(r.content)).pages) == 3
