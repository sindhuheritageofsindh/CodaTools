export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(i ? 1 : 0)} ${units[i]}`
}

export function stem(name = 'file') {
  return name.replace(/\.[^/.]+$/, '') || 'file'
}

export function isPdf(file) {
  return Boolean(file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)))
}

export function isHeic(file) {
  return Boolean(file && (/\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/i.test(file.type || '')))
}

export function isImage(file) {
  return Boolean(file && !isHeic(file) && (file.type?.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)))
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read this file.'))
    reader.readAsDataURL(file)
  })
}

export function loadImage(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This image could not be opened.'))
    }
    img.src = url
  })
}

export function canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The browser could not create the output file.'))),
      type,
      quality,
    )
  })
}

export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text)
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  ta.remove()
}

export async function shaDigest(algorithm, text) {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest(algorithm, data)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
