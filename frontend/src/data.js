export const categories = ['All', 'Image', 'PDF', 'QR', 'Text', 'Developer']

export const tools = [
  { id: 'remove-bg', name: 'Remove Background', category: 'Image', mark: 'BG', desc: 'Remove plain or near-solid backgrounds locally.' },
  { id: 'compress-image', name: 'Compress Image', category: 'Image', mark: '↓', desc: 'Reduce image size with quality control.' },
  { id: 'resize-image', name: 'Resize Image', category: 'Image', mark: '↔', desc: 'Resize by exact width and height.' },
  { id: 'convert-image', name: 'Convert Image', category: 'Image', mark: '⇄', desc: 'PNG, JPG and WebP conversion.' },
  { id: 'crop-image', name: 'Crop Image', category: 'Image', mark: '⌗', desc: 'Crop by pixels or centered presets.' },
  { id: 'rotate-image', name: 'Rotate / Flip Image', category: 'Image', mark: '↻', desc: 'Rotate 90° steps and flip images.' },
  { id: 'metadata-remove', name: 'Remove Metadata', category: 'Image', mark: '×', desc: 'Create a clean image copy without EXIF metadata.' },
  { id: 'exif-viewer', name: 'EXIF Viewer', category: 'Image', mark: 'i', desc: 'Inspect camera, GPS and image metadata.' },
  { id: 'heic-jpg', name: 'HEIC → JPG', category: 'Image', mark: 'H', desc: 'Convert iPhone HEIC/HEIF photos to JPG.' },
  { id: 'ocr', name: 'Image → Text', category: 'Image', mark: 'Aa', desc: 'Extract English text with browser OCR.' },
  { id: 'image-watermark', name: 'Watermark Image', category: 'Image', mark: 'W', desc: 'Add text watermark to an image.' },
  { id: 'passport-photo', name: 'Passport Photo Maker', category: 'Image', mark: 'ID', desc: 'Create clean ID-photo layouts from a portrait.' },
  { id: 'screenshot-beautify', name: 'Screenshot Beautifier', category: 'Image', mark: '▣', desc: 'Add padding, frame, radius and shadow.' },
  { id: 'image-pdf', name: 'Image → PDF', category: 'Image', mark: 'P', desc: 'Combine one or more images into a PDF.' },

  { id: 'merge-pdf', name: 'Merge PDF', category: 'PDF', mark: '+', desc: 'Combine PDFs in selected order.' },
  { id: 'split-pdf', name: 'Split PDF', category: 'PDF', mark: '÷', desc: 'Extract ranges or split every page.' },
  { id: 'compress-pdf', name: 'Compress PDF', category: 'PDF', mark: '↓', desc: 'Losslessly optimize PDF structure and streams.' },
  { id: 'pdf-jpg', name: 'PDF → JPG', category: 'PDF', mark: 'J', desc: 'Render selected PDF pages as JPG.' },
  { id: 'rotate-pdf', name: 'Rotate PDF Pages', category: 'PDF', mark: '↻', desc: 'Rotate selected pages by 90°, 180° or 270°.' },
  { id: 'reorder-pdf', name: 'Reorder PDF Pages', category: 'PDF', mark: '≡', desc: 'Create a new page order.' },
  { id: 'delete-pdf', name: 'Delete PDF Pages', category: 'PDF', mark: '−', desc: 'Remove unwanted pages from a PDF.' },
  { id: 'watermark-pdf', name: 'Watermark PDF', category: 'PDF', mark: 'W', desc: 'Stamp text across every PDF page.' },

  { id: 'qr-generate', name: 'QR Generator', category: 'QR', mark: 'QR', desc: 'Create QR codes for text, links and Wi-Fi.' },
  { id: 'qr-scan', name: 'QR Scanner', category: 'QR', mark: '⌁', desc: 'Read QR codes from uploaded images.' },

  { id: 'word-counter', name: 'Word Counter', category: 'Text', mark: '#', desc: 'Count words, characters, sentences and reading time.' },
  { id: 'char-counter', name: 'Character Counter', category: 'Text', mark: '123', desc: 'Count characters with and without spaces.' },
  { id: 'case-converter', name: 'Text Case Converter', category: 'Text', mark: 'aA', desc: 'Upper, lower, title, sentence and slug case.' },

  { id: 'json', name: 'JSON Formatter', category: 'Developer', mark: '{}', desc: 'Format, minify and validate JSON.' },
  { id: 'base64', name: 'Base64 Encode / Decode', category: 'Developer', mark: '64', desc: 'Unicode-safe Base64 utility.' },
  { id: 'jwt', name: 'JWT Decoder', category: 'Developer', mark: 'JWT', desc: 'Decode JWT header and payload locally.' },
  { id: 'url-codec', name: 'URL Encode / Decode', category: 'Developer', mark: '%', desc: 'Encode and decode URL components.' },
  { id: 'uuid', name: 'UUID Generator', category: 'Developer', mark: 'ID', desc: 'Generate cryptographically random UUID v4 values.' },
  { id: 'password', name: 'Password Generator', category: 'Developer', mark: '*', desc: 'Generate strong random passwords locally.' },
  { id: 'hash', name: 'Hash Generator', category: 'Developer', mark: '#', desc: 'Generate SHA-256, SHA-384 and SHA-512 hashes.' },
  { id: 'color', name: 'HEX / RGB Converter', category: 'Developer', mark: '◐', desc: 'Pick a color and convert between HEX and RGB.' },
]
