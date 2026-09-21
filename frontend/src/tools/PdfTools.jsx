import { useState } from 'react'
import FileDrop from '../components/FileDrop'
import Status from '../components/Status'
import { apiDownload } from '../lib/api'
import { formatBytes, isPdf } from '../lib/files'

const SAFE_REQUEST_BYTES = 3.8 * 1024 * 1024
function requestSizeOk(files) { return (Array.isArray(files) ? files : [files]).filter(Boolean).reduce((n, f) => n + f.size, 0) <= SAFE_REQUEST_BYTES }

function PdfFileSummary({ files }) {
  const list = Array.isArray(files) ? files : files ? [files] : []
  if (!list.length) return null
  return <div className="file-list">{list.map((f, i) => <div key={`${f.name}-${i}`}><span>{list.length > 1 ? `${i + 1}. ` : ''}{f.name}</span><span>{formatBytes(f.size)}</span></div>)}</div>
}

function Submit({ label, busy, disabled, onClick }) {
  return <div className="actions"><button className="btn btn-primary" disabled={disabled || busy} onClick={onClick}>{busy ? 'Working…' : label}</button></div>
}

export function MergePdfTool() {
  const [files, setFiles] = useState([]), [busy, setBusy] = useState(false), [message, setMessage] = useState('Choose at least two PDFs. They will be merged in the shown order.')
  async function run() {
    try { setBusy(true); const fd = new FormData(); files.forEach((f) => fd.append('files', f)); await apiDownload('/api/merge-pdf', fd, 'codatools-merged.pdf'); setMessage(`Merged ${files.length} PDFs.`) } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }
  return <div className="tool-body"><FileDrop accept="application/pdf,.pdf" multiple label="Drop two or more PDFs" onFiles={(f) => { const good = f.filter(isPdf); if (!requestSizeOk(good)) { setFiles([]); setMessage('Keep the combined PDF upload under about 3.8 MB for Vercel.'); return } setFiles(good); setMessage(`${good.length} PDF${good.length === 1 ? '' : 's'} selected.`) }} /><PdfFileSummary files={files} /><Status>{message}</Status><Submit label="Merge PDFs" busy={busy} disabled={files.length < 2} onClick={run} /></div>
}

export function SplitPdfTool() {
  const [file, setFile] = useState(null), [mode, setMode] = useState('range'), [pages, setPages] = useState('1'), [busy, setBusy] = useState(false), [message, setMessage] = useState('Choose a PDF, then extract a range or split every page.')
  async function run() { try { setBusy(true); const fd = new FormData(); fd.append('file', file); fd.append('mode', mode); fd.append('pages', pages); await apiDownload('/api/split-pdf', fd, mode === 'all' ? 'pages.zip' : 'selected-pages.pdf'); setMessage('Split complete.') } catch (e) { setMessage(e.message) } finally { setBusy(false) } }
  return <div className="tool-body"><FileDrop accept="application/pdf,.pdf" label="Drop PDF to split" onFiles={(f) => isPdf(f[0]) && (requestSizeOk(f[0]) ? setFile(f[0]) : setMessage('Keep this PDF under about 3.8 MB for Vercel.'))} /><PdfFileSummary files={file} /><div className="control-grid"><label>Mode<select value={mode} onChange={(e) => setMode(e.target.value)}><option value="range">Extract selected pages</option><option value="all">Split every page to ZIP</option></select></label>{mode === 'range' && <label>Pages<input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="1-3, 5" /></label>}</div><Status>{message}</Status><Submit label={mode === 'all' ? 'Split all pages' : 'Extract pages'} busy={busy} disabled={!file || (mode === 'range' && !pages.trim())} onClick={run} /></div>
}

export function CompressPdfTool() {
  const [file, setFile] = useState(null), [busy, setBusy] = useState(false), [message, setMessage] = useState('Lossless structural compression. Scanned/image-heavy PDFs may not shrink much.')
  async function run() { try { setBusy(true); const fd = new FormData(); fd.append('file', file); const { response } = await apiDownload('/api/compress-pdf', fd, 'compressed.pdf'); const a = Number(response.headers.get('x-coda-original-size')), b = Number(response.headers.get('x-coda-output-size')); setMessage(a && b ? `Done · ${formatBytes(a)} → ${formatBytes(b)}` : 'Compression complete.') } catch (e) { setMessage(e.message) } finally { setBusy(false) } }
  return <div className="tool-body"><FileDrop accept="application/pdf,.pdf" label="Drop PDF to compress" onFiles={(f) => isPdf(f[0]) && (requestSizeOk(f[0]) ? setFile(f[0]) : setMessage('Keep this PDF under about 3.8 MB for Vercel.'))} /><PdfFileSummary files={file} /><Status>{message}</Status><Submit label="Compress PDF" busy={busy} disabled={!file} onClick={run} /></div>
}

export function PdfToJpgTool() {
  const [file, setFile] = useState(null), [pages, setPages] = useState('1'), [dpi, setDpi] = useState(120), [quality, setQuality] = useState(86), [busy, setBusy] = useState(false), [message, setMessage] = useState('Use page numbers like 1, 3-5 or all. Up to 30 pages per conversion.')
  async function run() { try { setBusy(true); const fd = new FormData(); fd.append('file', file); fd.append('pages', pages); fd.append('dpi', dpi); fd.append('quality', quality); await apiDownload('/api/pdf-to-jpg', fd, pages.trim().includes(',') || pages.trim().toLowerCase() === 'all' || pages.trim().includes('-') ? 'pages.zip' : 'page.jpg'); setMessage('Conversion complete.') } catch (e) { setMessage(e.message) } finally { setBusy(false) } }
  return <div className="tool-body"><FileDrop accept="application/pdf,.pdf" label="Drop PDF to convert" onFiles={(f) => isPdf(f[0]) && (requestSizeOk(f[0]) ? setFile(f[0]) : setMessage('Keep this PDF under about 3.8 MB for Vercel.'))} /><PdfFileSummary files={file} /><div className="control-grid"><label>Pages<input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="1 or 1-3 or all" /></label><label>DPI<select value={dpi} onChange={(e) => setDpi(+e.target.value)}><option value="96">96</option><option value="120">120</option><option value="150">150</option><option value="180">180</option></select></label><label>JPG quality<input type="range" min="55" max="95" value={quality} onChange={(e) => setQuality(+e.target.value)} /><span>{quality}%</span></label></div><Status>{message}</Status><Submit label="Convert to JPG" busy={busy} disabled={!file || !pages.trim()} onClick={run} /></div>
}

export function RotatePdfTool() {
  const [file, setFile] = useState(null), [pages, setPages] = useState('1'), [angle, setAngle] = useState(90), [busy, setBusy] = useState(false), [message, setMessage] = useState('Rotate selected pages without rasterizing the PDF.')
  async function run() { try { setBusy(true); const fd = new FormData(); fd.append('file', file); fd.append('pages', pages); fd.append('angle', angle); await apiDownload('/api/rotate-pdf', fd, 'rotated.pdf'); setMessage('Rotation complete.') } catch (e) { setMessage(e.message) } finally { setBusy(false) } }
  return <div className="tool-body"><FileDrop accept="application/pdf,.pdf" label="Drop PDF to rotate" onFiles={(f) => isPdf(f[0]) && (requestSizeOk(f[0]) ? setFile(f[0]) : setMessage('Keep this PDF under about 3.8 MB for Vercel.'))} /><PdfFileSummary files={file} /><div className="control-grid"><label>Pages<input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="1-3, 5" /></label><label>Angle<select value={angle} onChange={(e) => setAngle(+e.target.value)}><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">270° clockwise</option></select></label></div><Status>{message}</Status><Submit label="Rotate pages" busy={busy} disabled={!file || !pages.trim()} onClick={run} /></div>
}

export function ReorderPdfTool() {
  const [file, setFile] = useState(null), [order, setOrder] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('Enter every page exactly once in the new order, e.g. 3,1,2,4-6.')
  async function run() { try { setBusy(true); const fd = new FormData(); fd.append('file', file); fd.append('order', order); await apiDownload('/api/reorder-pdf', fd, 'reordered.pdf'); setMessage('Reorder complete.') } catch (e) { setMessage(e.message) } finally { setBusy(false) } }
  return <div className="tool-body"><FileDrop accept="application/pdf,.pdf" label="Drop PDF to reorder" onFiles={(f) => isPdf(f[0]) && (requestSizeOk(f[0]) ? setFile(f[0]) : setMessage('Keep this PDF under about 3.8 MB for Vercel.'))} /><PdfFileSummary files={file} /><label className="single-control">New page order<input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="3,1,2,4-6" /></label><Status>{message}</Status><Submit label="Reorder PDF" busy={busy} disabled={!file || !order.trim()} onClick={run} /></div>
}

export function DeletePdfTool() {
  const [file, setFile] = useState(null), [pages, setPages] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('Enter the pages to remove, e.g. 2, 4-6.')
  async function run() { try { setBusy(true); const fd = new FormData(); fd.append('file', file); fd.append('pages', pages); await apiDownload('/api/delete-pdf-pages', fd, 'pages-removed.pdf'); setMessage('Pages removed.') } catch (e) { setMessage(e.message) } finally { setBusy(false) } }
  return <div className="tool-body"><FileDrop accept="application/pdf,.pdf" label="Drop PDF" onFiles={(f) => isPdf(f[0]) && (requestSizeOk(f[0]) ? setFile(f[0]) : setMessage('Keep this PDF under about 3.8 MB for Vercel.'))} /><PdfFileSummary files={file} /><label className="single-control">Pages to delete<input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="2, 4-6" /></label><Status>{message}</Status><Submit label="Delete pages" busy={busy} disabled={!file || !pages.trim()} onClick={run} /></div>
}

export function WatermarkPdfTool() {
  const [file, setFile] = useState(null), [text, setText] = useState('CONFIDENTIAL'), [fontSize, setFontSize] = useState(42), [opacity, setOpacity] = useState(0.22), [rotation, setRotation] = useState(45), [busy, setBusy] = useState(false), [message, setMessage] = useState('Adds a centered text watermark to every page.')
  async function run() { try { setBusy(true); const fd = new FormData(); fd.append('file', file); fd.append('text', text); fd.append('font_size', fontSize); fd.append('opacity', opacity); fd.append('rotation', rotation); await apiDownload('/api/watermark-pdf', fd, 'watermarked.pdf'); setMessage('Watermark added.') } catch (e) { setMessage(e.message) } finally { setBusy(false) } }
  return <div className="tool-body"><FileDrop accept="application/pdf,.pdf" label="Drop PDF to watermark" onFiles={(f) => isPdf(f[0]) && (requestSizeOk(f[0]) ? setFile(f[0]) : setMessage('Keep this PDF under about 3.8 MB for Vercel.'))} /><PdfFileSummary files={file} /><div className="control-grid"><label className="span-2">Watermark text<input maxLength="80" value={text} onChange={(e) => setText(e.target.value)} /></label><label>Font size<input type="number" min="12" max="120" value={fontSize} onChange={(e) => setFontSize(+e.target.value)} /></label><label>Opacity<input type="range" min="0.05" max="0.8" step="0.05" value={opacity} onChange={(e) => setOpacity(+e.target.value)} /><span>{Math.round(opacity * 100)}%</span></label><label>Rotation<input type="number" min="-90" max="90" value={rotation} onChange={(e) => setRotation(+e.target.value)} /></label></div><Status>{message}</Status><Submit label="Watermark PDF" busy={busy} disabled={!file || !text.trim()} onClick={run} /></div>
}
