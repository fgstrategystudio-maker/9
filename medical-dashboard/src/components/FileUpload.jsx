import React, { useRef } from 'react'
import { Upload } from 'lucide-react'

export default function FileUpload({ onFileSelect, accept = '.pdf,image/*' }) {
  const inputRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      const base64 = dataUrl.split(',')[1]
      onFileSelect({ file, base64, dataUrl, mediaType: file.type, filename: file.name })
    }
    reader.readAsDataURL(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current.click()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
    >
      <Upload size={24} className="mx-auto text-gray-400 mb-2" />
      <p className="text-sm text-gray-500">Trascina un file o clicca per selezionarlo</p>
      <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, JPEG</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  )
}
