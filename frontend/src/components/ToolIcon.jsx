import * as Icons from 'lucide-react'

const categoryFallbacks = {
  Image: Icons.Image,
  PDF: Icons.FileText,
  QR: Icons.QrCode,
  Text: Icons.Type,
  Developer: Icons.Code2,
}

export default function ToolIcon({ tool, size = 21, strokeWidth = 1.8 }) {
  const Icon = Icons[tool?.icon] || categoryFallbacks[tool?.category] || Icons.Wrench
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />
}
