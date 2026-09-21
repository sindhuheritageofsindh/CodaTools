import { useMemo, useState } from 'react'
import Status from '../components/Status'
import { copyText, downloadBlob, shaDigest } from '../lib/files'

function TextArea({ value, onChange, placeholder = 'Enter text…', rows = 12 }) {
  return <textarea className="code-area" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
}

function CopyDownload({ text, filename = 'codatools.txt' }) {
  return <div className="actions"><button className="btn btn-secondary" disabled={!text} onClick={() => copyText(text)}>Copy</button><button className="btn btn-secondary" disabled={!text} onClick={() => downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), filename)}>Download</button></div>
}

export function WordCounterTool() {
  const [text, setText] = useState('')
  const stats = useMemo(() => {
    const trimmed = text.trim()
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0
    const sentences = trimmed ? (trimmed.match(/[.!?]+(?=\s|$)/g) || []).length || 1 : 0
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0
    return { words, chars: text.length, noSpaces: text.replace(/\s/g, '').length, sentences, paragraphs, reading: words ? Math.max(1, Math.ceil(words / 220)) : 0 }
  }, [text])
  return <div className="tool-body"><TextArea value={text} onChange={setText} placeholder="Paste or type text here…" /><div className="metric-grid"><div><strong>{stats.words}</strong><span>Words</span></div><div><strong>{stats.chars}</strong><span>Characters</span></div><div><strong>{stats.sentences}</strong><span>Sentences</span></div><div><strong>{stats.paragraphs}</strong><span>Paragraphs</span></div><div><strong>{stats.reading} min</strong><span>Reading</span></div></div><CopyDownload text={text} /></div>
}

export function CharacterCounterTool() {
  const [text, setText] = useState('')
  const lines = text ? text.split('\n').length : 0
  return <div className="tool-body"><TextArea value={text} onChange={setText} /><div className="metric-grid"><div><strong>{text.length}</strong><span>Characters</span></div><div><strong>{text.replace(/\s/g, '').length}</strong><span>No spaces</span></div><div><strong>{(text.match(/\s/g) || []).length}</strong><span>Whitespace</span></div><div><strong>{lines}</strong><span>Lines</span></div></div><CopyDownload text={text} /></div>
}

function titleCase(text) { return text.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()) }
function sentenceCase(text) { return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (m) => m.toUpperCase()) }
function slugify(text) { return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }

export function CaseConverterTool() {
  const [text, setText] = useState('')
  const apply = (kind) => {
    if (kind === 'upper') setText(text.toUpperCase())
    if (kind === 'lower') setText(text.toLowerCase())
    if (kind === 'title') setText(titleCase(text))
    if (kind === 'sentence') setText(sentenceCase(text))
    if (kind === 'slug') setText(slugify(text))
  }
  return <div className="tool-body"><TextArea value={text} onChange={setText} /><div className="actions wrap"><button className="btn btn-secondary" onClick={() => apply('upper')}>UPPERCASE</button><button className="btn btn-secondary" onClick={() => apply('lower')}>lowercase</button><button className="btn btn-secondary" onClick={() => apply('title')}>Title Case</button><button className="btn btn-secondary" onClick={() => apply('sentence')}>Sentence case</button><button className="btn btn-secondary" onClick={() => apply('slug')}>slug-case</button></div><CopyDownload text={text} /></div>
}

export function JsonTool() {
  const [input, setInput] = useState(''), [output, setOutput] = useState(''), [message, setMessage] = useState('Paste JSON, then format, minify or validate it.')
  function parse() { try { return JSON.parse(input) } catch (e) { setMessage(`Invalid JSON: ${e.message}`); return null } }
  function format() { const data = parse(); if (data !== null) { setOutput(JSON.stringify(data, null, 2)); setMessage('Valid JSON · formatted.') } }
  function minify() { const data = parse(); if (data !== null) { setOutput(JSON.stringify(data)); setMessage('Valid JSON · minified.') } }
  function validate() { const data = parse(); if (data !== null) { setOutput(''); setMessage('Valid JSON.') } }
  return <div className="tool-body"><div className="split-editors"><TextArea value={input} onChange={setInput} placeholder='{"hello":"world"}' /><TextArea value={output} onChange={setOutput} placeholder="Output" /></div><Status>{message}</Status><div className="actions wrap"><button className="btn btn-primary" onClick={format}>Format</button><button className="btn btn-secondary" onClick={minify}>Minify</button><button className="btn btn-secondary" onClick={validate}>Validate</button><button className="btn btn-secondary" disabled={!output} onClick={() => copyText(output)}>Copy output</button></div></div>
}

function encodeBase64Unicode(value) { const bytes = new TextEncoder().encode(value); let binary = ''; const chunk = 0x8000; for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk)); return btoa(binary) }
function decodeBase64Unicode(value) { const binary = atob(value.replace(/\s/g, '')); const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0)); return new TextDecoder().decode(bytes) }

export function Base64Tool() {
  const [input, setInput] = useState(''), [output, setOutput] = useState(''), [message, setMessage] = useState('Unicode-safe Base64 encoder and decoder.')
  function encode() { try { setOutput(encodeBase64Unicode(input)); setMessage('Encoded.') } catch (e) { setMessage(e.message) } }
  function decode() { try { setOutput(decodeBase64Unicode(input)); setMessage('Decoded.') } catch { setMessage('Input is not valid Base64.') } }
  return <div className="tool-body"><div className="split-editors"><TextArea value={input} onChange={setInput} /><TextArea value={output} onChange={setOutput} placeholder="Output" /></div><Status>{message}</Status><div className="actions"><button className="btn btn-primary" onClick={encode}>Encode</button><button className="btn btn-secondary" onClick={decode}>Decode</button><button className="btn btn-secondary" disabled={!output} onClick={() => copyText(output)}>Copy</button></div></div>
}

function b64urlDecode(value) {
  let base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) base64 += '='
  return decodeURIComponent(Array.from(atob(base64)).map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''))
}

export function JwtTool() {
  const [token, setToken] = useState(''), [header, setHeader] = useState(''), [payload, setPayload] = useState(''), [message, setMessage] = useState('Decodes JWT content locally. Signature verification is not performed.')
  function decode() { try { const parts = token.trim().split('.'); if (parts.length < 2) throw new Error('JWT must contain at least header and payload.'); setHeader(JSON.stringify(JSON.parse(b64urlDecode(parts[0])), null, 2)); setPayload(JSON.stringify(JSON.parse(b64urlDecode(parts[1])), null, 2)); setMessage('Decoded locally. This does not verify the signature.') } catch (e) { setMessage(`Could not decode JWT: ${e.message}`); setHeader(''); setPayload('') } }
  return <div className="tool-body"><TextArea value={token} onChange={setToken} rows={6} placeholder="eyJhbGciOi..." /><Status>{message}</Status><button className="btn btn-primary" onClick={decode}>Decode JWT</button>{(header || payload) && <div className="split-editors"><div><span className="editor-label">Header</span><textarea className="code-area" rows="10" readOnly value={header} /></div><div><span className="editor-label">Payload</span><textarea className="code-area" rows="10" readOnly value={payload} /></div></div>}</div>
}

export function UrlCodecTool() {
  const [input, setInput] = useState(''), [output, setOutput] = useState(''), [message, setMessage] = useState('Encode or decode a URL component.')
  function encode() { setOutput(encodeURIComponent(input)); setMessage('Encoded.') }
  function decode() { try { setOutput(decodeURIComponent(input)); setMessage('Decoded.') } catch { setMessage('Input contains malformed percent-encoding.') } }
  return <div className="tool-body"><div className="split-editors"><TextArea value={input} onChange={setInput} /><TextArea value={output} onChange={setOutput} /></div><Status>{message}</Status><div className="actions"><button className="btn btn-primary" onClick={encode}>Encode</button><button className="btn btn-secondary" onClick={decode}>Decode</button><button className="btn btn-secondary" disabled={!output} onClick={() => copyText(output)}>Copy</button></div></div>
}

export function UuidTool() {
  const [count, setCount] = useState(5), [output, setOutput] = useState('')
  function generate() { const n = Math.max(1, Math.min(100, count)); setOutput(Array.from({ length: n }, () => crypto.randomUUID()).join('\n')) }
  return <div className="tool-body"><label className="single-control">How many UUIDs?<input type="number" min="1" max="100" value={count} onChange={(e) => setCount(+e.target.value)} /></label><button className="btn btn-primary" onClick={generate}>Generate UUID v4</button>{output && <><textarea className="code-area" rows="12" readOnly value={output} /><CopyDownload text={output} filename="codatools-uuids.txt" /></>}</div>
}

const LOWER = 'abcdefghijklmnopqrstuvwxyz', UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', NUMBERS = '0123456789', SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?'
function randomFrom(chars) { const max = 256 - (256 % chars.length); const a = new Uint8Array(1); do crypto.getRandomValues(a); while (a[0] >= max); return chars[a[0] % chars.length] }
function shuffleSecure(chars) { const out = [...chars]; for (let i = out.length - 1; i > 0; i -= 1) { const a = new Uint32Array(1); crypto.getRandomValues(a); const j = a[0] % (i + 1); [out[i], out[j]] = [out[j], out[i]] } return out.join('') }

export function PasswordTool() {
  const [length, setLength] = useState(20), [lower, setLower] = useState(true), [upper, setUpper] = useState(true), [numbers, setNumbers] = useState(true), [symbols, setSymbols] = useState(true), [output, setOutput] = useState(''), [message, setMessage] = useState('Generated entirely in your browser with Web Crypto.')
  function generate() { const groups = []; if (lower) groups.push(LOWER); if (upper) groups.push(UPPER); if (numbers) groups.push(NUMBERS); if (symbols) groups.push(SYMBOLS); if (!groups.length) return setMessage('Select at least one character group.'); const n = Math.max(groups.length, Math.min(128, length)); let value = groups.map(randomFrom).join(''); const all = groups.join(''); while (value.length < n) value += randomFrom(all); setOutput(shuffleSecure(value)); setMessage(`${n}-character password generated.`) }
  return <div className="tool-body"><div className="control-grid"><label>Length<input type="number" min="8" max="128" value={length} onChange={(e) => setLength(+e.target.value)} /></label><label className="check"><input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} /> Lowercase</label><label className="check"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Uppercase</label><label className="check"><input type="checkbox" checked={numbers} onChange={(e) => setNumbers(e.target.checked)} /> Numbers</label><label className="check"><input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} /> Symbols</label></div><Status>{message}</Status><button className="btn btn-primary" onClick={generate}>Generate password</button>{output && <div className="password-output"><code>{output}</code><button className="btn btn-secondary" onClick={() => copyText(output)}>Copy</button></div>}</div>
}

export function HashTool() {
  const [input, setInput] = useState(''), [algorithm, setAlgorithm] = useState('SHA-256'), [output, setOutput] = useState(''), [busy, setBusy] = useState(false)
  async function run() { setBusy(true); try { setOutput(await shaDigest(algorithm, input)) } finally { setBusy(false) } }
  return <div className="tool-body"><TextArea value={input} onChange={setInput} rows={8} /><label className="single-control">Algorithm<select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></label><div className="actions"><button className="btn btn-primary" disabled={busy} onClick={run}>{busy ? 'Hashing…' : 'Generate hash'}</button><button className="btn btn-secondary" disabled={!output} onClick={() => copyText(output)}>Copy hash</button></div>{output && <textarea className="code-area" rows="4" readOnly value={output} />}</div>
}


export function ColorTool() {
  const [hex, setHex] = useState('#11110f')
  const [rgb, setRgb] = useState('17, 17, 15')
  const [message, setMessage] = useState('Pick a color or enter HEX/RGB values.')
  function fromHex(value) {
    let clean = value.trim().replace(/^#/, '')
    if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('')
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return setMessage('Enter a valid 3- or 6-digit HEX color.')
    const n = parseInt(clean, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
    setHex(`#${clean.toLowerCase()}`); setRgb(`${r}, ${g}, ${b}`); setMessage('Converted HEX → RGB.')
  }
  function fromRgb(value) {
    const parts = value.split(/[ ,]+/).filter(Boolean).map(Number)
    if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return setMessage('Enter RGB as three numbers from 0 to 255.')
    const out = `#${parts.map((n) => n.toString(16).padStart(2, '0')).join('')}`
    setHex(out); setRgb(parts.join(', ')); setMessage('Converted RGB → HEX.')
  }
  return <div className="tool-body"><div className="color-hero" style={{ background: hex }} /><div className="control-grid"><label>Color picker<input type="color" value={hex} onChange={(e) => { setHex(e.target.value); fromHex(e.target.value) }} /></label><label>HEX<input value={hex} onChange={(e) => setHex(e.target.value)} onBlur={() => fromHex(hex)} /></label><label>RGB<input value={rgb} onChange={(e) => setRgb(e.target.value)} onBlur={() => fromRgb(rgb)} /></label></div><Status>{message}</Status><div className="actions"><button className="btn btn-secondary" onClick={() => copyText(hex)}>Copy HEX</button><button className="btn btn-secondary" onClick={() => copyText(`rgb(${rgb})`)}>Copy RGB</button></div></div>
}
