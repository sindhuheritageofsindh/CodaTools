import { downloadBlob } from './files'

function filenameFromDisposition(disposition, fallback) {
  const match = /filename\*?=(?:UTF-8''|\")?([^\";]+)/i.exec(disposition || '')
  return match ? decodeURIComponent(match[1].replace(/\"/g, '').trim()) : fallback
}

export async function apiDownload(path, formData, fallbackName) {
  let response
  try {
    response = await fetch(path, { method: 'POST', body: formData })
  } catch {
    throw new Error('CodaTools backend is unavailable. Start FastAPI or deploy the full project.')
  }
  if (!response.ok) {
    let message = `Request failed (${response.status}).`
    try {
      const body = await response.json()
      if (body.error) message = body.error
      if (body.detail && typeof body.detail === 'string') message = body.detail
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message)
  }
  const blob = await response.blob()
  const name = filenameFromDisposition(response.headers.get('content-disposition'), fallbackName)
  downloadBlob(blob, name)
  return { blob, response, filename: name }
}
