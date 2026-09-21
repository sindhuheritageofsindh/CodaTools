import { CheckCircle2, Info, X } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  if (!toast) return null
  const Icon = toast.tone === 'success' ? CheckCircle2 : Info
  return <div className="toast" role="status">
    <span className="toast-icon"><Icon size={18} /></span>
    <div><strong>{toast.title}</strong>{toast.message && <p>{toast.message}</p>}</div>
    <button onClick={onClose} aria-label="Dismiss notification"><X size={16} /></button>
  </div>
}
