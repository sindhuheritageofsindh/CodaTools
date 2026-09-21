import { useRef, useState } from 'react'
import { FileText, Image as ImageIcon, Upload } from 'lucide-react'

export default function FileDrop({ accept, multiple = false, label = 'Drop files here', onFiles }) {
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)

  function handle(files) {
    const list = Array.from(files || [])
    if (list.length) onFiles(list)
  }

  const isPdf = /pdf/i.test(accept || '')
  const isImage = /image|heic|heif/i.test(accept || '')
  const DropIcon = isPdf ? FileText : isImage ? ImageIcon : Upload

  return (
    <button
      type="button"
      className={`dropzone ${drag ? 'is-dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true) }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => { e.preventDefault(); setDrag(false) }}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files) }}
    >
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handle(e.target.files)}
      />
      <span className="drop-icon"><DropIcon size={21} strokeWidth={1.8} /></span>
      <strong>{label}</strong>
      <span>{multiple ? 'or click to choose files' : 'or click to choose a file'}</span>
    </button>
  )
}
