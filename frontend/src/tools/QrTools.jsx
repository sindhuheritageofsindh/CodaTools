import { useState } from 'react'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import FileDrop from '../components/FileDrop'
import Status from '../components/Status'
import { copyText, downloadBlob, isImage, loadImage } from '../lib/files'

function wifiEscape(value) {
  return String(value).replace(/([\\;,:"])/g, '\\$1')
}

export function QRGenerateTool() {
  const [type, setType] = useState('text')
  const [text, setText] = useState('https://example.com')
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [security, setSecurity] = useState('WPA')
  const [hidden, setHidden] = useState(false)
  const [size, setSize] = useState(512)
  const [dataUrl, setDataUrl] = useState('')
  const [message, setMessage] = useState('Enter content and generate a QR code.')

  async function run() {
    try {
      let value = text.trim()
      if (type === 'wifi') {
        if (!ssid.trim()) throw new Error('Enter the Wi-Fi name (SSID).')
        value = `WIFI:T:${security};S:${wifiEscape(ssid.trim())};P:${wifiEscape(password)};H:${hidden ? 'true' : 'false'};;`
      }
      if (!value) throw new Error('Enter text or a URL.')
      const url = await QRCode.toDataURL(value, { width: size, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
      setDataUrl(url)
      setMessage('QR code generated.')
    } catch (e) { setMessage(e.message) }
  }

  async function download() {
    if (!dataUrl) return
    const blob = await (await fetch(dataUrl)).blob()
    downloadBlob(blob, 'codatools-qr.png')
  }

  return <div className="tool-body">
    <div className="control-grid">
      <label>QR type<select value={type} onChange={(e) => setType(e.target.value)}><option value="text">URL / Text</option><option value="wifi">Wi-Fi</option></select></label>
      {type === 'text' ? <label className="span-2">Content<input value={text} onChange={(e) => setText(e.target.value)} placeholder="https://example.com" /></label> : <>
        <label>Wi-Fi name<input value={ssid} onChange={(e) => setSsid(e.target.value)} /></label>
        <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <label>Security<select value={security} onChange={(e) => setSecurity(e.target.value)}><option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="nopass">None</option></select></label>
        <label className="check"><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> Hidden network</label>
      </>}
      <label>Size<select value={size} onChange={(e) => setSize(+e.target.value)}><option value="256">256 px</option><option value="512">512 px</option><option value="1024">1024 px</option></select></label>
    </div>
    {dataUrl && <div className="qr-output"><img src={dataUrl} alt="Generated QR code" /></div>}
    <Status>{message}</Status>
    <div className="actions"><button className="btn btn-primary" onClick={run}>Generate QR</button><button className="btn btn-secondary" disabled={!dataUrl} onClick={download}>Download PNG</button></div>
  </div>
}

export function QRScanTool() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState('')
  const [message, setMessage] = useState('Choose an image containing a QR code.')
  const [busy, setBusy] = useState(false)

  async function scan() {
    if (!file) return
    try {
      setBusy(true)
      const img = await loadImage(file)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(img, 0, 0)

      if ('BarcodeDetector' in window) {
        try {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
          const codes = await detector.detect(canvas)
          if (codes.length && codes[0].rawValue) {
            setResult(codes[0].rawValue); setMessage('QR code decoded.'); return
          }
        } catch {
          // fall through to jsQR
        }
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' })
      if (!code?.data) throw new Error('No readable QR code found in this image.')
      setResult(code.data); setMessage('QR code decoded.')
    } catch (e) { setResult(''); setMessage(e.message) } finally { setBusy(false) }
  }

  const isLink = /^https?:\/\//i.test(result)
  return <div className="tool-body">
    <FileDrop accept="image/*" label="Drop an image containing a QR code" onFiles={(f) => { if (isImage(f[0])) { setFile(f[0]); setResult(''); setMessage(`${f[0].name} ready to scan.`) } }} />
    <Status>{message}</Status>
    {result && <textarea className="code-area" rows="6" value={result} readOnly />}
    <div className="actions"><button className="btn btn-primary" disabled={!file || busy} onClick={scan}>{busy ? 'Scanning…' : 'Scan QR'}</button><button className="btn btn-secondary" disabled={!result} onClick={() => copyText(result)}>Copy result</button>{isLink && <a className="btn btn-secondary" href={result} target="_blank" rel="noreferrer">Open link</a>}</div>
  </div>
}
