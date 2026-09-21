export default function PreviewImage({ src, label, meta, checker = false }) {
  if (!src) return null
  return (
    <div className="preview-item">
      <div className={`preview-card ${checker ? 'checker' : ''}`}>
        <img src={src} alt={label || 'Preview'} />
      </div>
      <div className="preview-caption"><span>{label}</span><span>{meta}</span></div>
    </div>
  )
}
