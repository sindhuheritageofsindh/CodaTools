from __future__ import annotations

from html import escape
from pathlib import Path
from urllib.parse import urljoin

TOOLS = {
    "background-remover": ("Remove Background", "Remove plain and near-solid backgrounds from PNG, JPG and WebP images online with CodaTools."),
    "image-compressor": ("Compress Image", "Compress JPG, PNG and WebP images online with adjustable quality and fast downloads."),
    "image-resizer": ("Resize Image", "Resize JPG, PNG and WebP images to exact width and height online with CodaTools."),
    "image-converter": ("Image Converter", "Convert images between PNG, JPG and WebP formats online with CodaTools."),
    "image-cropper": ("Crop Image", "Crop images online using precise pixel coordinates and dimensions with CodaTools."),
    "rotate-flip-image": ("Rotate / Flip Image", "Rotate and flip images online by 90, 180 or 270 degrees with CodaTools."),
    "metadata-remover": ("Metadata Remover", "Remove EXIF, GPS location, camera details and other embedded metadata from images online."),
    "metadata-checker": ("Metadata Checker", "Check image metadata and view EXIF, GPS coordinates, camera model, lens, date taken, exposure settings, creator details and every detected metadata field."),
    "heic-to-jpg": ("HEIC to JPG", "Convert iPhone HEIC and HEIF photos to JPG online with adjustable image quality."),
    "image-to-text": ("Image to Text", "Extract editable text from images, screenshots and photos online using OCR."),
    "watermark-image": ("Watermark Image", "Add customizable text watermarks to JPG and PNG images online."),
    "passport-photo-maker": ("Passport Photo Maker", "Create passport and ID photo layouts online using common photo dimensions."),
    "screenshot-beautifier": ("Screenshot Beautifier", "Beautify screenshots with padding, rounded corners, shadows and backgrounds."),
    "image-to-pdf": ("Image to PDF", "Convert one or multiple JPG, PNG and WebP images into a PDF online."),

    "merge-pdf": ("Merge PDF", "Merge multiple PDF files into one document online in your selected order."),
    "split-pdf": ("Split PDF", "Split PDF files, extract page ranges or export every page separately online."),
    "compress-pdf": ("Compress PDF", "Reduce PDF file size with structural optimization while preserving document content."),
    "pdf-to-jpg": ("PDF to JPG", "Convert selected PDF pages to JPG images online with CodaTools."),
    "rotate-pdf": ("Rotate PDF Pages", "Rotate selected PDF pages by 90, 180 or 270 degrees online."),
    "reorder-pdf-pages": ("Reorder PDF Pages", "Rearrange PDF pages online and download the document in your preferred order."),
    "delete-pdf-pages": ("Delete PDF Pages", "Remove unwanted pages from a PDF online and download the cleaned document."),
    "watermark-pdf": ("Watermark PDF", "Add customizable text watermarks to every page of a PDF online."),

    "qr-code-generator": ("QR Code Generator", "Create downloadable QR codes for links, text and Wi-Fi networks online."),
    "qr-code-scanner": ("QR Code Scanner", "Scan and decode QR codes from uploaded images and screenshots online."),

    "word-counter": ("Word Counter", "Count words, characters, sentences, paragraphs and estimated reading time online."),
    "character-counter": ("Character Counter", "Count characters, spaces and lines in text instantly online."),
    "text-case-converter": ("Text Case Converter", "Convert text to uppercase, lowercase, title case, sentence case or slug case."),

    "json-formatter": ("JSON Formatter", "Format, beautify, minify and validate JSON online."),
    "base64-encoder-decoder": ("Base64 Encoder / Decoder", "Encode Unicode text to Base64 or decode Base64 back to readable text online."),
    "jwt-decoder": ("JWT Decoder", "Decode JWT headers and payload data locally in your browser."),
    "url-encoder-decoder": ("URL Encoder / Decoder", "Encode URL components or decode percent-encoded text online."),
    "uuid-generator": ("UUID Generator", "Generate cryptographically random UUID v4 identifiers online."),
    "password-generator": ("Password Generator", "Generate strong random passwords with configurable letters, numbers and symbols."),
    "hash-generator": ("Hash Generator", "Generate SHA-256, SHA-384 and SHA-512 hashes from text online."),
    "hex-rgb-converter": ("HEX / RGB Converter", "Convert HEX colors to RGB and RGB values to HEX online."),
}

DEFAULT_TITLE = "CodaTools — Free Online Image, PDF, QR & Developer Tools"
DEFAULT_DESCRIPTION = "Free online tools for images, PDFs, QR codes, text and developer workflows. Fast, private and easy to use."


def tool_meta(slug: str | None):
    if slug and slug in TOOLS:
        name, description = TOOLS[slug]
        return {
            "title": f"{name} Online — Free {name} Tool | CodaTools",
            "description": description,
            "name": name,
        }
    return {"title": DEFAULT_TITLE, "description": DEFAULT_DESCRIPTION, "name": "CodaTools"}


def render_index(index_path: Path, origin: str, slug: str | None = None) -> str:
    html = index_path.read_text(encoding="utf-8")
    meta = tool_meta(slug)
    canonical_path = f"/tools/{slug}" if slug in TOOLS else "/"
    canonical = urljoin(origin.rstrip("/") + "/", canonical_path.lstrip("/"))
    schema_type = "SoftwareApplication" if slug in TOOLS else "WebSite"
    schema = (
        '{"@context":"https://schema.org","@type":"%s","name":"%s","url":"%s","description":"%s"}'
        % (schema_type, escape(meta["name"]), escape(canonical), escape(meta["description"]))
    )

    injection = f"""
    <meta name="description" content="{escape(meta['description'], quote=True)}" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
    <link rel="canonical" href="{escape(canonical, quote=True)}" />
    <meta property="og:title" content="{escape(meta['title'], quote=True)}" />
    <meta property="og:description" content="{escape(meta['description'], quote=True)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{escape(canonical, quote=True)}" />
    <meta property="og:site_name" content="CodaTools" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">{schema}</script>
    """
    html = html.replace("<title>CodaTools — Simple tools. Instant results.</title>", f"<title>{escape(meta['title'])}</title>")
    return html.replace("</head>", injection + "\n  </head>")


def sitemap_xml(origin: str) -> str:
    base = origin.rstrip("/")
    urls = [f"{base}/"] + [f"{base}/tools/{slug}" for slug in TOOLS]
    rows = "".join(f"<url><loc>{escape(url)}</loc><changefreq>weekly</changefreq><priority>{'1.0' if url.endswith('/') else '0.8'}</priority></url>" for url in urls)
    return f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{rows}</urlset>'
