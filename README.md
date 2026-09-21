# CodaTools 3.0 — React + Vite + FastAPI

CodaTools is a minimal light/dark utility suite with **35 working tool surfaces**. Most image, QR, text and developer tools run in the browser. PDF operations use a FastAPI backend.

## Stack

- Frontend: React + Vite
- Backend: FastAPI
- PDF: pypdf + pypdfium2 + Pillow + ReportLab
- Browser utilities: QRCode, jsQR, jsPDF, heic2any, Tesseract.js, exifr, Web Crypto
- Deployment: Vercel-ready single project

## Tools

### Image — 14
1. Remove Background (plain / near-solid backgrounds)
2. Compress Image
3. Resize Image
4. Convert Image (PNG/JPG/WebP)
5. Crop Image
6. Rotate / Flip Image
7. Remove Metadata
8. EXIF Viewer
9. HEIC / HEIF → JPG
10. Image → Text (OCR)
11. Watermark Image
12. Passport Photo Maker
13. Screenshot Beautifier
14. Image → PDF

### PDF — 8
15. Merge PDF
16. Split PDF
17. Compress PDF
18. PDF → JPG
19. Rotate PDF Pages
20. Reorder PDF Pages
21. Delete PDF Pages
22. Watermark PDF

### QR — 2
23. QR Generator
24. QR Scanner

### Text — 3
25. Word Counter
26. Character Counter
27. Text Case Converter

### Developer — 8
28. JSON Formatter / Validator
29. Base64 Encode / Decode
30. JWT Decoder
31. URL Encode / Decode
32. UUID v4 Generator
33. Password Generator
34. Hash Generator (SHA-256/384/512)
35. HEX / RGB Converter

## Local development

Use two terminals from the project root.

### Terminal 1 — FastAPI

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Terminal 2 — React/Vite

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to FastAPI on port 8000.

## Production build

```bash
npm run build
```

The root build script installs the frontend packages and produces `frontend/dist`. FastAPI serves that production build after all `/api/*` routes.

## Vercel

Upload/deploy the **whole project root**. Important files:

```text
app.py
pdf_utils.py
pyproject.toml
package.json
vercel.json
frontend/
  package.json
  vite.config.js
  src/
```

`pyproject.toml` explicitly sets:

```toml
[tool.vercel]
entrypoint = "app:app"
```

Python is pinned to the 3.12 line for stable binary/package compatibility.

### PDF upload limit

The hosted PDF tools intentionally target requests under roughly **4 MB** because serverless request/response limits can reject larger files. Browser-only tools do not use that PDF backend limit.

## Tests performed in this package

Backend tests cover:
- 2-page + 3-page merge → 5 pages
- selected page extraction
- split all pages → ZIP
- PDF compression
- PDF → JPG
- page rotation
- page reordering
- page deletion
- PDF watermarking
- `/api/health`

Run the test file with:

```bash
python -m pytest tests/test_backend.py
```

## Notes

- Background removal is a local edge-connected solid-background remover, not a generative AI cutout model.
- Passport Photo Maker creates dimensions/layout only; official photo requirements vary by country.
- JWT Decoder decodes header/payload but does not verify signatures.
- OCR runs in the browser and may download OCR model assets on first use.
