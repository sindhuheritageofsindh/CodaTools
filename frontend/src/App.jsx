import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Moon, Search, ShieldCheck, Sparkles, Sun, X } from 'lucide-react'
import { categories, tools } from './data'
import ToolIcon from './components/ToolIcon'
import Toast from './components/Toast'
import { findToolFromLocation, navigate, setSeo, toolPath } from './seo'
import {
  CompressImageTool, ConvertImageTool, CropImageTool, MetadataCheckerTool, HeicToJpgTool, ImageToPdfTool,
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
  'remove-bg': RemoveBackgroundTool, 'compress-image': CompressImageTool, 'resize-image': ResizeImageTool,
  'convert-image': ConvertImageTool, 'crop-image': CropImageTool, 'rotate-image': RotateImageTool,
  'metadata-remove': MetadataRemoveTool, 'metadata-checker': MetadataCheckerTool, 'heic-jpg': HeicToJpgTool,
  ocr: OCRTool, 'image-watermark': ImageWatermarkTool, 'passport-photo': PassportPhotoTool,
  'screenshot-beautify': ScreenshotBeautifyTool, 'image-pdf': ImageToPdfTool,
  'merge-pdf': MergePdfTool, 'split-pdf': SplitPdfTool, 'compress-pdf': CompressPdfTool,
  'pdf-jpg': PdfToJpgTool, 'rotate-pdf': RotatePdfTool, 'reorder-pdf': ReorderPdfTool,
  'delete-pdf': DeletePdfTool, 'watermark-pdf': WatermarkPdfTool,
  'qr-generate': QRGenerateTool, 'qr-scan': QRScanTool,
  'word-counter': WordCounterTool, 'char-counter': CharacterCounterTool, 'case-converter': CaseConverterTool,
  json: JsonTool, base64: Base64Tool, jwt: JwtTool, 'url-codec': UrlCodecTool, uuid: UuidTool,
  password: PasswordTool, hash: HashTool, color: ColorTool,
}

function Header({ theme, setTheme, onSearch }) {
  return <header className="site-header clay-nav">
    <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate('/') }} aria-label="CodaTools home">
      <span className="brand-mark"><Sparkles size={16} /></span><span>CodaTools</span>
    </a>
    <nav className="header-actions">
      <button className="nav-search" onClick={onSearch}><Search size={16} /><span>Search tools</span><kbd>⌘K</kbd></button>
      <span className="tool-count">{tools.length} tools</span>
      <button className="icon-btn clay-button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
    </nav>
  </header>
}

function ToolCard({ tool }) {
  return <a className={`tool-card clay-card category-${tool.category.toLowerCase()}`} href={toolPath(tool)} onClick={(e) => { e.preventDefault(); navigate(toolPath(tool)) }}>
    <span className="tool-mark"><ToolIcon tool={tool} /></span>
    <span className="tool-card-copy"><small>{tool.category}</small><strong>{tool.name}</strong><span>{tool.desc}</span></span>
    <span className="tool-arrow">↗</span>
  </a>
}

function SearchPalette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const results = tools.filter((tool) => `${tool.name} ${tool.category} ${tool.keywords}`.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
  useEffect(() => { if (!open) setQuery('') }, [open])
  if (!open) return null
  return <div className="palette-shell" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="palette clay-panel">
      <div className="palette-search"><Search size={19} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search CodaTools…" /><button onClick={onClose}><X size={18} /></button></div>
      <div className="palette-results">{results.map((tool) => <button key={tool.id} onClick={() => { navigate(toolPath(tool)); onClose() }}><span className="tool-mark mini"><ToolIcon tool={tool} size={17} /></span><span><strong>{tool.name}</strong><small>{tool.category}</small></span><span>↗</span></button>)}</div>
    </div>
  </div>
}

function HomePage({ setToast }) {
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') || '')
  const filtered = useMemo(() => tools.filter((tool) => {
    const categoryOk = category === 'All' || tool.category === category
    return categoryOk && `${tool.name} ${tool.desc} ${tool.keywords}`.toLowerCase().includes(query.trim().toLowerCase())
  }), [category, query])

  useEffect(() => {
    if (!sessionStorage.getItem('codatools-welcome')) {
      sessionStorage.setItem('codatools-welcome', '1')
      const timer = setTimeout(() => setToast({ title: 'Privacy-first by design', message: 'Most CodaTools utilities process files directly in your browser.' }), 650)
      return () => clearTimeout(timer)
    }
  }, [setToast])

  return <main id="top">
    <section className="hero">
      <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
      <span className="eyebrow">{tools.length} focused utilities · no account</span>
      <h1>Useful tools,<br /><em>without the clutter.</em></h1>
      <p>Professional image, PDF, QR, text and developer utilities in a fast, privacy-conscious workspace built for every screen.</p>
      <div className="hero-actions"><a href="#tools" className="btn btn-primary clay-button">Explore all tools</a><span><ShieldCheck size={16} /> Most tools run locally</span></div>
    </section>

    <section className="category-showcase">
      {['Image','PDF','QR','Text','Developer'].map((name) => {
        const sample = tools.find((tool) => tool.category === name)
        return <button key={name} className={`category-clay category-${name.toLowerCase()}`} onClick={() => { setCategory(name); document.getElementById('tools')?.scrollIntoView() }}>
          <span><ToolIcon tool={sample} size={22} /></span><strong>{name}</strong><small>{tools.filter((t) => t.category === name).length} tools</small>
        </button>
      })}
    </section>

    <section className="tool-browser" id="tools">
      <div className="browser-top clay-toolbar">
        <div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search background remover, PDF, JSON…" aria-label="Search tools" /></div>
        <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
      </div>
      <div className="results-line"><strong>{filtered.length}</strong> professional tool{filtered.length === 1 ? '' : 's'} {category !== 'All' ? `in ${category}` : ''}</div>
      <div className="tool-grid">{filtered.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div>
      {!filtered.length && <div className="empty-state clay-card">No tools match “{query}”.</div>}
    </section>

    <section className="privacy-strip clay-panel"><div><span className="eyebrow">Privacy by default</span><h2>Your files stay local whenever possible.</h2></div><p>Image editing, QR, text and developer tools run in your browser. Server-side PDF operations process the current request only; CodaTools does not provide file storage.</p></section>
  </main>
}

function ToolPage({ tool }) {
  const Component = components[tool.id]
  const related = tools.filter((item) => item.category === tool.category && item.id !== tool.id).slice(0, 3)
  return <main className="tool-page">
    <div className="breadcrumb"><a href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}>Home</a><span>/</span><span>{tool.category}</span><span>/</span><strong>{tool.name}</strong></div>
    <section className={`tool-hero category-${tool.category.toLowerCase()}`}>
      <a className="back-link" href="/" onClick={(e) => { e.preventDefault(); navigate('/') }}><ArrowLeft size={16} /> All tools</a>
      <div className="tool-hero-icon"><ToolIcon tool={tool} size={32} strokeWidth={1.7} /></div>
      <span className="eyebrow">{tool.category} utility</span>
      <h1>{tool.name}</h1>
      <p>{tool.seoDescription}</p>
      <div className="trust-row"><span><ShieldCheck size={15} /> Privacy-conscious</span><span>No signup</span><span>Free to use</span></div>
    </section>

    <section className="workspace clay-panel">
      <div className="workspace-head"><div><span className="eyebrow">Workspace</span><h2>Use {tool.name}</h2></div><span className="workspace-category"><ToolIcon tool={tool} size={17} /> {tool.category}</span></div>
      <Component />
    </section>

    <section className="seo-copy clay-soft">
      <div><span className="eyebrow">About this tool</span><h2>{tool.name} online</h2></div>
      <p>{tool.seoDescription} CodaTools keeps the workflow focused: choose your input, adjust only the settings you need, process it, and download or copy the result.</p>
    </section>

    <section className="related-section"><span className="eyebrow">Related tools</span><h2>More {tool.category} utilities</h2><div className="tool-grid related-grid">{related.map((item) => <ToolCard key={item.id} tool={item} />)}</div></section>
  </main>
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('codatools-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const [routeTool, setRouteTool] = useState(() => findToolFromLocation())
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('codatools-theme', theme)
  }, [theme])

  useEffect(() => {
    const sync = () => { const tool = findToolFromLocation(); setRouteTool(tool); setSeo(tool); window.scrollTo({ top: 0, behavior: 'auto' }) }
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    const key = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(true) }
      if (e.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 4600)
    return () => clearTimeout(timer)
  }, [toast])

  return <>
    <Header theme={theme} setTheme={setTheme} onSearch={() => setPaletteOpen(true)} />
    {routeTool ? <ToolPage tool={routeTool} /> : <HomePage setToast={setToast} />}
    <footer><span>CodaTools · {new Date().getFullYear()}</span><span>Fast utilities. Calm interface.</span></footer>
    <SearchPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    <Toast toast={toast} onClose={() => setToast(null)} />
  </>
}
