import { useEffect, useState } from 'react'
import heic2any from 'heic2any'
import { jsPDF } from 'jspdf'
import { createWorker } from 'tesseract.js'
import * as exifr from 'exifr'
import FileDrop from '../components/FileDrop'
import PreviewImage from '../components/PreviewImage'
import Status from '../components/Status'
import { removeConnectedBackground } from '../lib/background'
import { canvasToBlob, copyText, downloadBlob, fileToDataUrl, formatBytes, isHeic, isImage, loadImage, stem } from '../lib/files'
import { useObjectUrl } from '../lib/hooks'

function Actions({ primary, onPrimary, busy=false, disabled=false, secondary, onSecondary, secondaryDisabled=false }) {
  return <div className="actions"><button className="btn btn-primary" onClick={onPrimary} disabled={disabled || busy}>{busy ? 'Working…' : primary}</button>{secondary && <button className="btn btn-secondary" onClick={onSecondary} disabled={secondaryDisabled}>{secondary}</button>}</div>
}

function OutputPreview({ file, result, resultLabel='Output', checker=false }) {
  const resultUrl = useObjectUrl(result)
  const [inputUrl, setInputUrl] = useState('')
  useEffect(() => {
    let live = true
    if (!file) { setInputUrl(''); return () => { live = false } }
    fileToDataUrl(file).then((u) => live && setInputUrl(u)).catch(() => {})
    return () => { live = false }
  }, [file])
  return <div className="preview-grid"><PreviewImage src={inputUrl} label="Original" meta={file ? formatBytes(file.size) : ''} /><PreviewImage src={resultUrl} label={resultLabel} meta={result ? formatBytes(result.size) : ''} checker={checker} /></div>
}

function extFor(type) {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  return 'png'
}

async function renderImage(file, type='image/png', quality=.92, mutate) {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height) }
  ctx.drawImage(img, 0, 0)
  if (mutate) await mutate({ img, canvas, ctx })
  return canvasToBlob(canvas, type, quality)
}

export function RemoveBackgroundTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[sensitivity,setSensitivity]=useState(48),[feather,setFeather]=useState(8),[busy,setBusy]=useState(false),[message,setMessage]=useState('Works best when the background reaches the image edges.')
  async function run(){ try{setBusy(true); const img=await loadImage(file); if(img.naturalWidth*img.naturalHeight>18_000_000) throw new Error('Use an image under 18 megapixels.'); const c=document.createElement('canvas'); c.width=img.naturalWidth;c.height=img.naturalHeight; const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,c.width,c.height);removeConnectedBackground(d,c.width,c.height,sensitivity,feather);ctx.putImageData(d,0,0);setResult(await canvasToBlob(c,'image/png',1));setMessage('Done. Adjust sensitivity if needed.')}catch(e){setMessage(e.message)}finally{setBusy(false)}}
  return <div className="tool-body"><FileDrop accept="image/png,image/jpeg,image/webp" label="Drop PNG, JPG or WebP" onFiles={(f)=>{if(isImage(f[0])){setFile(f[0]);setResult(null)}}}/><div className="control-grid"><label>Sensitivity<input type="range" min="12" max="120" value={sensitivity} onChange={(e)=>setSensitivity(+e.target.value)}/><span>{sensitivity}</span></label><label>Feather<input type="range" min="0" max="30" value={feather} onChange={(e)=>setFeather(+e.target.value)}/><span>{feather}</span></label></div>{file&&<OutputPreview file={file} result={result} resultLabel="Transparent PNG" checker/>}<Status>{message}</Status><Actions primary="Remove background" onPrimary={run} busy={busy} disabled={!file} secondary="Download PNG" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}-no-bg.png`)} secondaryDisabled={!result}/></div>
}

export function CompressImageTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[quality,setQuality]=useState(75),[format,setFormat]=useState('image/webp'),[busy,setBusy]=useState(false),[message,setMessage]=useState('Choose an image.')
  async function run(){try{setBusy(true);const blob=await renderImage(file,format,quality/100);setResult(blob);const d=Math.round((1-blob.size/file.size)*100);setMessage(`${formatBytes(blob.size)} · ${d>=0?d+'% smaller':Math.abs(d)+'% larger'}`)}catch(e){setMessage(e.message)}finally{setBusy(false)}}
  return <div className="tool-body"><FileDrop accept="image/*" label="Drop image to compress" onFiles={(f)=>isImage(f[0])&&(setFile(f[0]),setResult(null))}/><div className="control-grid"><label>Quality<input type="range" min="20" max="95" value={quality} onChange={(e)=>setQuality(+e.target.value)}/><span>{quality}%</span></label><label>Output<select value={format} onChange={(e)=>setFormat(e.target.value)}><option value="image/webp">WebP</option><option value="image/jpeg">JPEG</option></select></label></div>{file&&<OutputPreview file={file} result={result} resultLabel="Compressed"/>}<Status>{message}</Status><Actions primary="Compress" onPrimary={run} busy={busy} disabled={!file} secondary="Download" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}-compressed.${extFor(format)}`)} secondaryDisabled={!result}/></div>
}

export function ResizeImageTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[w,setW]=useState(1080),[h,setH]=useState(1080),[ratio,setRatio]=useState(1),[lock,setLock]=useState(true),[format,setFormat]=useState('image/png'),[busy,setBusy]=useState(false),[message,setMessage]=useState('Choose an image.')
  async function pick(f){const file=f[0];if(!isImage(file))return;const img=await loadImage(file);setFile(file);setResult(null);setW(img.naturalWidth);setH(img.naturalHeight);setRatio(img.naturalWidth/img.naturalHeight)}
  async function run(){try{setBusy(true);const img=await loadImage(file);const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');if(format==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)}ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,w,h);setResult(await canvasToBlob(c,format,.92));setMessage(`Resized to ${w} × ${h}`)}catch(e){setMessage(e.message)}finally{setBusy(false)}}
  return <div className="tool-body"><FileDrop accept="image/*" label="Drop image to resize" onFiles={pick}/><div className="control-grid"><label>Width<input type="number" min="1" max="12000" value={w} onChange={(e)=>{const n=+e.target.value;setW(n);if(lock)setH(Math.max(1,Math.round(n/ratio)))}}/></label><label>Height<input type="number" min="1" max="12000" value={h} onChange={(e)=>{const n=+e.target.value;setH(n);if(lock)setW(Math.max(1,Math.round(n*ratio)))}}/></label><label>Format<select value={format} onChange={(e)=>setFormat(e.target.value)}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label><label className="check"><input type="checkbox" checked={lock} onChange={(e)=>setLock(e.target.checked)}/> Keep aspect ratio</label></div>{file&&<OutputPreview file={file} result={result} resultLabel="Resized"/>}<Status>{message}</Status><Actions primary="Resize" onPrimary={run} busy={busy} disabled={!file||w<1||h<1} secondary="Download" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}-${w}x${h}.${extFor(format)}`)} secondaryDisabled={!result}/></div>
}

export function ConvertImageTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[format,setFormat]=useState('image/png'),[quality,setQuality]=useState(92),[busy,setBusy]=useState(false)
  async function run(){try{setBusy(true);setResult(await renderImage(file,format,quality/100))}finally{setBusy(false)}}
  return <div className="tool-body"><FileDrop accept="image/png,image/jpeg,image/webp" label="Drop PNG, JPG or WebP" onFiles={(f)=>isImage(f[0])&&(setFile(f[0]),setResult(null))}/><div className="control-grid"><label>Convert to<select value={format} onChange={(e)=>setFormat(e.target.value)}><option value="image/png">PNG</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option></select></label><label>Quality<input type="range" min="30" max="100" value={quality} onChange={(e)=>setQuality(+e.target.value)}/><span>{quality}%</span></label></div>{file&&<OutputPreview file={file} result={result}/>}<Actions primary="Convert" onPrimary={run} busy={busy} disabled={!file} secondary="Download" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}.${extFor(format)}`)} secondaryDisabled={!result}/></div>
}

export function CropImageTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[box,setBox]=useState({x:0,y:0,w:500,h:500}),[message,setMessage]=useState('Set crop coordinates in pixels.')
  async function pick(f){const file=f[0];if(!isImage(file))return;const img=await loadImage(file);setFile(file);setResult(null);setBox({x:0,y:0,w:img.naturalWidth,h:img.naturalHeight})}
  async function run(){try{const img=await loadImage(file);const x=Math.max(0,box.x),y=Math.max(0,box.y),w=Math.min(box.w,img.naturalWidth-x),h=Math.min(box.h,img.naturalHeight-y);if(w<1||h<1)throw new Error('Crop area is outside the image.');const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,x,y,w,h,0,0,w,h);setResult(await canvasToBlob(c,'image/png',1));setMessage(`Cropped to ${w} × ${h}`)}catch(e){setMessage(e.message)}}
  const change=(k,v)=>setBox((b)=>({...b,[k]:+v}))
  return <div className="tool-body"><FileDrop accept="image/*" label="Drop image to crop" onFiles={pick}/><div className="control-grid">{['x','y','w','h'].map((k)=><label key={k}>{k.toUpperCase()}<input type="number" min="0" value={box[k]} onChange={(e)=>change(k,e.target.value)}/></label>)}</div>{file&&<OutputPreview file={file} result={result} resultLabel="Cropped"/>}<Status>{message}</Status><Actions primary="Crop" onPrimary={run} disabled={!file} secondary="Download PNG" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}-crop.png`)} secondaryDisabled={!result}/></div>
}

export function RotateImageTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[angle,setAngle]=useState(90),[flipX,setFlipX]=useState(false),[flipY,setFlipY]=useState(false)
  async function run(){const img=await loadImage(file);const swap=angle%180!==0;const c=document.createElement('canvas');c.width=swap?img.naturalHeight:img.naturalWidth;c.height=swap?img.naturalWidth:img.naturalHeight;const ctx=c.getContext('2d');ctx.translate(c.width/2,c.height/2);ctx.rotate(angle*Math.PI/180);ctx.scale(flipX?-1:1,flipY?-1:1);ctx.drawImage(img,-img.naturalWidth/2,-img.naturalHeight/2);setResult(await canvasToBlob(c,'image/png',1))}
  return <div className="tool-body"><FileDrop accept="image/*" label="Drop image to rotate or flip" onFiles={(f)=>isImage(f[0])&&(setFile(f[0]),setResult(null))}/><div className="control-grid"><label>Rotation<select value={angle} onChange={(e)=>setAngle(+e.target.value)}><option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label><label className="check"><input type="checkbox" checked={flipX} onChange={(e)=>setFlipX(e.target.checked)}/> Flip horizontal</label><label className="check"><input type="checkbox" checked={flipY} onChange={(e)=>setFlipY(e.target.checked)}/> Flip vertical</label></div>{file&&<OutputPreview file={file} result={result}/>}<Actions primary="Apply" onPrimary={run} disabled={!file} secondary="Download PNG" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}-rotated.png`)} secondaryDisabled={!result}/></div>
}

async function readImageMetadata(file) {
  try {
    return await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      ihdr: true,
    }) || {}
  } catch {
    return {}
  }
}

function metadataValue(value) {
  if (value == null) return '—'
  if (value instanceof Date) return value.toLocaleString()
  if (Array.isArray(value)) return value.map(metadataValue).join(', ')
  if (typeof value === 'object') {
    try { return JSON.stringify(value) } catch { return String(value) }
  }
  if (typeof value === 'number' && !Number.isInteger(value)) return String(Math.round(value * 1000000) / 1000000)
  return String(value)
}

function firstMetadata(data, keys) {
  for (const key of keys) {
    if (data?.[key] !== undefined && data?.[key] !== null && data?.[key] !== '') return data[key]
  }
  return null
}

function MetadataRows({ rows }) {
  const visible = rows.filter((row) => row[1] !== null && row[1] !== undefined && row[1] !== '')
  if (!visible.length) return <p className="metadata-empty">No values detected in this group.</p>
  return <div className="metadata-table">{visible.map(([label, value]) => <div className="metadata-row" key={label}><span>{label}</span><strong>{metadataValue(value)}</strong></div>)}</div>
}

export function MetadataRemoveTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[stats,setStats]=useState(null),[message,setMessage]=useState('Re-encodes the image in your browser to remove embedded EXIF, GPS, XMP, IPTC and camera metadata.')

  async function choose(files) {
    const next=files[0]
    if(!isImage(next)) { setMessage('Choose a JPG, PNG or WebP image.'); return }
    setFile(next); setResult(null); setStats(null)
    const before=await readImageMetadata(next)
    const count=Object.keys(before).length
    setMessage(count ? `Detected ${count} metadata field${count===1?'':'s'} before cleaning.` : 'No readable EXIF-style metadata was detected, but you can still create a clean re-encoded copy.')
  }

  async function run(){
    try{
      setBusy(true)
      const before=await readImageMetadata(file)
      const type=['image/png','image/jpeg','image/webp'].includes(file.type) ? file.type : 'image/jpeg'
      const clean=await renderImage(file,type,.95)
      const after=await readImageMetadata(clean)
      setResult(clean)
      setStats({before:Object.keys(before).length,after:Object.keys(after).length})
      setMessage(Object.keys(after).length===0 ? 'Clean copy verified: no supported EXIF/XMP/IPTC/GPS fields were detected in the output.' : `Clean copy created. ${Object.keys(after).length} container field(s) remain readable by the metadata parser.`)
    }catch(e){setMessage(e.message)}finally{setBusy(false)}
  }

  const extension=file ? extFor(['image/png','image/jpeg','image/webp'].includes(file.type)?file.type:'image/jpeg') : 'jpg'
  return <div className="tool-body">
    <FileDrop accept="image/png,image/jpeg,image/webp" label="Drop image to remove metadata" onFiles={choose}/>
    {file&&<OutputPreview file={file} result={result} resultLabel="Metadata-clean copy"/>}
    {stats&&<div className="metadata-stats"><div><span>Before</span><strong>{stats.before}</strong><small>detected fields</small></div><div><span>After</span><strong>{stats.after}</strong><small>detected fields</small></div><div><span>Processing</span><strong>Local</strong><small>in your browser</small></div></div>}
    <Status>{message}</Status>
    <Actions primary="Remove metadata" onPrimary={run} busy={busy} disabled={!file} secondary="Download clean image" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}-metadata-clean.${extension}`)} secondaryDisabled={!result}/>
  </div>
}

export function MetadataCheckerTool() {
  const [file,setFile]=useState(null),[data,setData]=useState(null),[dimensions,setDimensions]=useState(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('Upload a photo to inspect all metadata CodaTools can detect. Nothing is uploaded to our server.')

  async function choose(files){
    const next=files[0]
    if(!next || (!isImage(next) && !isHeic(next))) { setMessage('Choose an image file to inspect.'); return }
    setFile(next);setData(null);setDimensions(null);setMessage(`${next.name} is ready to inspect.`)
  }

  async function run(){
    try{
      setBusy(true)
      const out=await readImageMetadata(file)
      let dims=null
      try {
        if (!isHeic(file)) {
          const img=await loadImage(file)
          dims={width:img.naturalWidth,height:img.naturalHeight}
        }
      } catch {}
      setData(out)
      setDimensions(dims)
      const count=Object.keys(out).length
      const hasGps=firstMetadata(out,['latitude','GPSLatitude'])!==null || firstMetadata(out,['longitude','GPSLongitude'])!==null
      setMessage(count ? `Found ${count} metadata field${count===1?'':'s'}${hasGps?' including location data':''}.` : 'No embedded metadata was detected. File information is still shown below.')
    }catch(e){setMessage(`Could not inspect metadata: ${e.message}`);setData({})}finally{setBusy(false)}
  }

  const entries=data ? Object.entries(data).filter(([,value])=>value!==undefined&&value!==null&&typeof value!=='function').sort(([a],[b])=>a.localeCompare(b)) : []
  const latitude=data&&firstMetadata(data,['latitude','GPSLatitude'])
  const longitude=data&&firstMetadata(data,['longitude','GPSLongitude'])
  const captureRows=data ? [
    ['Date taken',firstMetadata(data,['DateTimeOriginal','CreateDate','DateTimeDigitized','ModifyDate'])],
    ['Exposure time',firstMetadata(data,['ExposureTime'])],
    ['Aperture',firstMetadata(data,['FNumber','ApertureValue'])],
    ['ISO',firstMetadata(data,['ISO','ISOSpeedRatings','PhotographicSensitivity'])],
    ['Focal length',firstMetadata(data,['FocalLength','FocalLengthIn35mmFormat'])],
    ['Flash',firstMetadata(data,['Flash'])],
    ['White balance',firstMetadata(data,['WhiteBalance'])],
    ['Exposure program',firstMetadata(data,['ExposureProgram'])],
  ] : []
  const cameraRows=data ? [
    ['Camera make',firstMetadata(data,['Make'])],
    ['Camera model',firstMetadata(data,['Model'])],
    ['Lens',firstMetadata(data,['LensModel','Lens','LensInfo'])],
    ['Software',firstMetadata(data,['Software','CreatorTool'])],
    ['Artist',firstMetadata(data,['Artist','Creator'])],
    ['Copyright',firstMetadata(data,['Copyright','Rights'])],
  ] : []
  const imageRows=data ? [
    ['Orientation',firstMetadata(data,['Orientation'])],
    ['Color space',firstMetadata(data,['ColorSpace','ICCProfileName'])],
    ['X resolution',firstMetadata(data,['XResolution'])],
    ['Y resolution',firstMetadata(data,['YResolution'])],
    ['Compression',firstMetadata(data,['Compression'])],
    ['Bit depth',firstMetadata(data,['BitsPerSample','BitDepth'])],
  ] : []

  return <div className="tool-body">
    <FileDrop accept="image/*,.heic,.heif" label="Drop image to check metadata" onFiles={choose}/>
    <Status>{message}</Status>
    <Actions primary="Check metadata" onPrimary={run} busy={busy} disabled={!file} secondary="Copy all as JSON" onSecondary={()=>data&&copyText(JSON.stringify(data,null,2))} secondaryDisabled={!data}/>
    {file&&data&&<div className="metadata-report">
      <section className="metadata-overview">
        <div><span>File</span><strong>{file.name}</strong><small>{file.type||'Unknown type'} · {formatBytes(file.size)}</small></div>
        <div><span>Dimensions</span><strong>{dimensions?`${dimensions.width} × ${dimensions.height}`:'Not available'}</strong><small>{dimensions?`${(dimensions.width*dimensions.height/1_000_000).toFixed(2)} MP`:'Image dimensions not decoded'}</small></div>
        <div><span>Metadata fields</span><strong>{entries.length}</strong><small>detected by parser</small></div>
        <div className={latitude!==null&&longitude!==null?'has-location':''}><span>GPS</span><strong>{latitude!==null&&longitude!==null?'Detected':'Not detected'}</strong><small>{latitude!==null&&longitude!==null?`${metadataValue(latitude)}, ${metadataValue(longitude)}`:'No coordinates found'}</small></div>
      </section>

      <div className="metadata-groups">
        <section className="metadata-group"><h3>Camera & creator</h3><MetadataRows rows={cameraRows}/></section>
        <section className="metadata-group"><h3>Capture details</h3><MetadataRows rows={captureRows}/></section>
        <section className="metadata-group"><h3>Image properties</h3><MetadataRows rows={imageRows}/></section>
        <section className="metadata-group"><h3>Location</h3><MetadataRows rows={[
          ['Latitude',latitude],
          ['Longitude',longitude],
          ['Altitude',firstMetadata(data,['GPSAltitude','altitude'])],
          ['GPS date',firstMetadata(data,['GPSDateStamp','GPSDateTime'])],
          ['Direction',firstMetadata(data,['GPSImgDirection'])],
        ]}/></section>
      </div>

      <details className="metadata-raw" open>
        <summary>All detected metadata ({entries.length})</summary>
        {entries.length ? <div className="metadata-table metadata-all">{entries.map(([key,value])=><div className="metadata-row" key={key}><span>{key}</span><strong>{metadataValue(value)}</strong></div>)}</div> : <p className="metadata-empty">No embedded EXIF, GPS, XMP, IPTC or ICC metadata was detected.</p>}
      </details>

      <details className="metadata-raw">
        <summary>Raw JSON</summary>
        <textarea className="code-area" rows="16" readOnly value={JSON.stringify(data,null,2)}/>
      </details>
    </div>}
  </div>
}

export function HeicToJpgTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[quality,setQuality]=useState(90),[busy,setBusy]=useState(false),[message,setMessage]=useState('Choose an HEIC or HEIF image.')
  const outUrl=useObjectUrl(result)
  async function run(){try{setBusy(true);let blob=await heic2any({blob:file,toType:'image/jpeg',quality:quality/100});if(Array.isArray(blob))blob=blob[0];setResult(blob);setMessage('Converted to JPG.')}catch(e){setMessage(`HEIC conversion failed: ${e.message}`)}finally{setBusy(false)}}
  return <div className="tool-body"><FileDrop accept=".heic,.heif,image/heic,image/heif" label="Drop HEIC / HEIF image" onFiles={(f)=>{if(isHeic(f[0])){setFile(f[0]);setResult(null)}else setMessage('Choose an .heic or .heif file.')}}/><label className="range-control">JPG quality<input type="range" min="55" max="100" value={quality} onChange={(e)=>setQuality(+e.target.value)}/><span>{quality}%</span></label>{outUrl&&<PreviewImage src={outUrl} label="Converted JPG" meta={formatBytes(result.size)}/>}<Status>{message}</Status><Actions primary="Convert to JPG" onPrimary={run} busy={busy} disabled={!file} secondary="Download JPG" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}.jpg`)} secondaryDisabled={!result}/></div>
}

export function OCRTool() {
  const [file,setFile]=useState(null),[text,setText]=useState(''),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[message,setMessage]=useState('The first OCR run may download language data.')
  async function run(){let worker;try{setBusy(true);setProgress(0);worker=await createWorker('eng',1,{logger:(m)=>m.progress!=null&&setProgress(Math.round(m.progress*100))});const out=await worker.recognize(file);const value=(out.data.text||'').trim();setText(value);setMessage(value?'Text extraction complete.':'No readable text detected.')}catch(e){setMessage(`OCR failed: ${e.message}`)}finally{if(worker)await worker.terminate().catch(()=>{});setBusy(false)}}
  return <div className="tool-body"><FileDrop accept="image/*" label="Drop photo or screenshot with text" onFiles={(f)=>isImage(f[0])&&(setFile(f[0]),setText(''))}/>{busy&&<div className="progress"><span style={{width:`${progress}%`}}/></div>}<Status>{message}{busy?` ${progress}%`:''}</Status>{text&&<textarea className="code-area" rows="12" value={text} onChange={(e)=>setText(e.target.value)}/>}<Actions primary="Extract text" onPrimary={run} busy={busy} disabled={!file} secondary="Copy text" onSecondary={()=>copyText(text)} secondaryDisabled={!text}/>{text&&<button className="btn btn-secondary" onClick={()=>downloadBlob(new Blob([text],{type:'text/plain;charset=utf-8'}),`${stem(file.name)}-text.txt`)}>Download TXT</button>}</div>
}

export function ImageWatermarkTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[text,setText]=useState('CodaTools'),[size,setSize]=useState(42),[opacity,setOpacity]=useState(45),[position,setPosition]=useState('center')
  async function run(){const img=await loadImage(file);const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);ctx.globalAlpha=opacity/100;ctx.fillStyle='#fff';ctx.strokeStyle='#000';ctx.lineWidth=Math.max(2,size/12);ctx.font=`700 ${size}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';const map={center:[c.width/2,c.height/2],top:[c.width/2,size],bottom:[c.width/2,c.height-size]};const [x,y]=map[position];ctx.strokeText(text,x,y);ctx.fillText(text,x,y);ctx.globalAlpha=1;setResult(await canvasToBlob(c,file.type==='image/png'?'image/png':'image/jpeg',.94))}
  return <div className="tool-body"><FileDrop accept="image/*" label="Drop image to watermark" onFiles={(f)=>isImage(f[0])&&(setFile(f[0]),setResult(null))}/><div className="control-grid"><label>Text<input value={text} maxLength="80" onChange={(e)=>setText(e.target.value)}/></label><label>Font size<input type="number" min="12" max="240" value={size} onChange={(e)=>setSize(+e.target.value)}/></label><label>Opacity<input type="range" min="10" max="100" value={opacity} onChange={(e)=>setOpacity(+e.target.value)}/><span>{opacity}%</span></label><label>Position<select value={position} onChange={(e)=>setPosition(e.target.value)}><option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option></select></label></div>{file&&<OutputPreview file={file} result={result} resultLabel="Watermarked"/>}<Actions primary="Add watermark" onPrimary={run} disabled={!file||!text.trim()} secondary="Download" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}-watermarked.${file.type==='image/png'?'png':'jpg'}`)} secondaryDisabled={!result}/></div>
}

export function PassportPhotoTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[preset,setPreset]=useState('35x45'),[bg,setBg]=useState('#ffffff')
  const presets={'35x45':[413,531],'2x2':[600,600],'50x50':[591,591]}
  async function run(){const img=await loadImage(file);const [w,h]=presets[preset];const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);setResult(await canvasToBlob(c,'image/jpeg',.95))}
  return <div className="tool-body"><FileDrop accept="image/*" label="Drop portrait photo" onFiles={(f)=>isImage(f[0])&&(setFile(f[0]),setResult(null))}/><div className="control-grid"><label>Preset<select value={preset} onChange={(e)=>setPreset(e.target.value)}><option value="35x45">35 × 45 mm style</option><option value="2x2">2 × 2 inch style</option><option value="50x50">50 × 50 mm style</option></select></label><label>Background<input type="color" value={bg} onChange={(e)=>setBg(e.target.value)}/></label></div><Status>Creates dimensions/layout only. Verify official photo requirements for your country.</Status>{file&&<OutputPreview file={file} result={result} resultLabel="ID photo"/>}<Actions primary="Create photo" onPrimary={run} disabled={!file} secondary="Download JPG" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}-${preset}.jpg`)} secondaryDisabled={!result}/></div>
}

export function ScreenshotBeautifyTool() {
  const [file,setFile]=useState(null),[result,setResult]=useState(null),[padding,setPadding]=useState(80),[radius,setRadius]=useState(28),[shadow,setShadow]=useState(30),[bg,setBg]=useState('#e8e8e5')
  async function run(){const img=await loadImage(file);const c=document.createElement('canvas');c.width=img.naturalWidth+padding*2;c.height=img.naturalHeight+padding*2;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.save();ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=shadow;ctx.shadowOffsetY=Math.round(shadow/3);const x=padding,y=padding,w=img.naturalWidth,h=img.naturalHeight,r=Math.min(radius,w/2,h/2);ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.clip();ctx.drawImage(img,x,y);ctx.restore();setResult(await canvasToBlob(c,'image/png',1))}
  return <div className="tool-body"><FileDrop accept="image/*" label="Drop screenshot" onFiles={(f)=>isImage(f[0])&&(setFile(f[0]),setResult(null))}/><div className="control-grid"><label>Padding<input type="range" min="20" max="240" value={padding} onChange={(e)=>setPadding(+e.target.value)}/><span>{padding}px</span></label><label>Radius<input type="range" min="0" max="80" value={radius} onChange={(e)=>setRadius(+e.target.value)}/><span>{radius}px</span></label><label>Shadow<input type="range" min="0" max="80" value={shadow} onChange={(e)=>setShadow(+e.target.value)}/><span>{shadow}</span></label><label>Background<input type="color" value={bg} onChange={(e)=>setBg(e.target.value)}/></label></div>{file&&<OutputPreview file={file} result={result} resultLabel="Beautified"/>}<Actions primary="Beautify" onPrimary={run} disabled={!file} secondary="Download PNG" onSecondary={()=>result&&downloadBlob(result,`${stem(file.name)}-beautified.png`)} secondaryDisabled={!result}/></div>
}

export function ImageToPdfTool() {
  const [files,setFiles]=useState([]),[message,setMessage]=useState('Choose one or more images.')
  async function run(){if(!files.length)return;try{const doc=new jsPDF({unit:'pt',format:'a4'});for(let i=0;i<files.length;i++){const img=await loadImage(files[i]);if(i>0)doc.addPage();const pageW=doc.internal.pageSize.getWidth(),pageH=doc.internal.pageSize.getHeight(),margin=36,scale=Math.min((pageW-margin*2)/img.naturalWidth,(pageH-margin*2)/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0);doc.addImage(c.toDataURL('image/jpeg',.92),'JPEG',(pageW-w)/2,(pageH-h)/2,w,h,undefined,'FAST')}downloadBlob(doc.output('blob'),'codatools-images.pdf');setMessage(`Created ${files.length}-page PDF.`)}catch(e){setMessage(e.message)}}
  return <div className="tool-body"><FileDrop accept="image/png,image/jpeg,image/webp" multiple label="Drop one or more images" onFiles={(f)=>{const good=f.filter(isImage);setFiles(good);setMessage(`${good.length} image${good.length===1?'':'s'} selected.`)}}/>{files.length>0&&<div className="file-list">{files.map((f,i)=><div key={`${f.name}-${i}`}><span>{i+1}. {f.name}</span><span>{formatBytes(f.size)}</span></div>)}</div>}<Status>{message}</Status><Actions primary="Create PDF" onPrimary={run} disabled={!files.length}/></div>
}
