import { useEffect, useMemo, useState } from 'react'
import { Moon, Search, ShieldCheck, Sun, X } from 'lucide-react'
import { categories, tools } from './data'
import {
  CompressImageTool, ConvertImageTool, CropImageTool, ExifViewerTool, HeicToJpgTool, ImageToPdfTool,
  ImageWatermarkTool, MetadataRemoveTool, OCRTool, PassportPhotoTool, RemoveBackgroundTool, ResizeImageTool,
  RotateImageTool, ScreenshotBeautifyTool,
} from './tools/ImageTools'
import { QRGenerateTool, QRScanTool } from './tools/QrTools'
import {
  CompressPdfTool, DeletePdfTool, MergePdfTool, PdfToJpgTool, ReorderPdfTool, RotatePdfTool, SplitPdfTool, WatermarkPdfTool,
} from './tools/PdfTools'
import {
  Base64Tool, CaseConverterTool, CharacterCounterTool, ColorTool, HashTool, JsonTool, JwtTool, PasswordTool, UrlCodecTool, UuidTool, WordCounterTool,
} from './tools/TextDevTools'

const components = {
  'remove-bg': RemoveBackgroundTool,
  'compress-image': CompressImageTool,
  'resize-image': ResizeImageTool,
  'convert-image': ConvertImageTool,
  'crop-image': CropImageTool,
  'rotate-image': RotateImageTool,
  'metadata-remove': MetadataRemoveTool,
  'exif-viewer': ExifViewerTool,
  'heic-jpg': HeicToJpgTool,
  ocr: OCRTool,
  'image-watermark': ImageWatermarkTool,
  'passport-photo': PassportPhotoTool,
  'screenshot-beautify': ScreenshotBeautifyTool,
  'image-pdf': ImageToPdfTool,
  'merge-pdf': MergePdfTool,
  'split-pdf': SplitPdfTool,
  'compress-pdf': CompressPdfTool,
  'pdf-jpg': PdfToJpgTool,
  'rotate-pdf': RotatePdfTool,
  'reorder-pdf': ReorderPdfTool,
  'delete-pdf': DeletePdfTool,
  'watermark-pdf': WatermarkPdfTool,
  'qr-generate': QRGenerateTool,
  'qr-scan': QRScanTool,
  'word-counter': WordCounterTool,
  'char-counter': CharacterCounterTool,
  'case-converter': CaseConverterTool,
  json: JsonTool,
  base64: Base64Tool,
  jwt: JwtTool,
  'url-codec': UrlCodecTool,
  uuid: UuidTool,
  password: PasswordTool,
  hash: HashTool,
  color: ColorTool,
}

function ToolCard({ tool, onOpen }) {
  return <button type="button" className="tool-card" onClick={() => onOpen(tool)}>
    <span className="tool-mark">{tool.mark}</span>
    <span className="tool-card-copy"><strong>{tool.name}</strong><span>{tool.desc}</span></span>
    <span className="tool-arrow">↗</span>
  </button>
}

function ToolModal({ tool, onClose }) {
  const Component = tool ? components[tool.id] : null
  useEffect(() => {
    if (!tool) return undefined
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    document.body.classList.add('modal-open')
    return () => { window.removeEventListener('keydown', handler); document.body.classList.remove('modal-open') }
  }, [tool, onClose])
  if (!tool || !Component) return null
  return <div className="modal-shell" role="dialog" aria-modal="true" aria-label={tool.name} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal-card">
      <header className="modal-header"><div><span className="eyebrow">{tool.category} tool</span><h2>{tool.name}</h2><p>{tool.desc}</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></header>
      <div className="modal-content"><Component /></div>
    </div>
  </div>
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('codatools-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('codatools-theme', theme)
  }, [theme])

  const filtered = useMemo(() => tools.filter((tool) => {
    const categoryOk = category === 'All' || tool.category === category
    const haystack = `${tool.name} ${tool.desc} ${tool.category}`.toLowerCase()
    return categoryOk && haystack.includes(query.trim().toLowerCase())
  }), [category, query])

  return <>
    <header className="site-header">
      <a className="brand" href="#top" aria-label="CodaTools home"><span className="brand-dot" />CodaTools</a>
      <nav className="header-actions"><span className="tool-count">{tools.length} tools</span><button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button></nav>
    </header>

    <main id="top">
      <section className="hero">
        <span className="eyebrow">Private browser utilities</span>
        <h1>Simple tools.<br />Instant results.</h1>
        <p>Images, PDFs, QR codes, text and developer utilities in one clean workspace. No account required.</p>
        <div className="hero-badges"><span><ShieldCheck size={16} /> Most tools run locally</span><span>React + Vite</span><span>FastAPI</span></div>
      </section>

      <section className="tool-browser" id="tools">
        <div className="browser-top">
          <div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${tools.length} tools…`} aria-label="Search tools" /></div>
          <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
        </div>

        <div className="results-line"><strong>{filtered.length}</strong> tool{filtered.length === 1 ? '' : 's'} {category !== 'All' ? `in ${category}` : ''}</div>
        <div className="tool-grid">{filtered.map((tool) => <ToolCard key={tool.id} tool={tool} onOpen={setActive} />)}</div>
        {!filtered.length && <div className="empty-state">No tools match “{query}”.</div>}
      </section>

      <section className="privacy-strip"><div><span className="eyebrow">Privacy by default</span><h2>Your files stay local whenever possible.</h2></div><p>Image editing, QR, text and developer tools run in your browser. PDF tools that need server processing are sent only for the current operation and are not stored by CodaTools.</p></section>
    </main>

    <footer><span>CodaTools</span><span>Built for fast everyday work.</span></footer>
    <ToolModal tool={active} onClose={() => setActive(null)} />
  </>
}
