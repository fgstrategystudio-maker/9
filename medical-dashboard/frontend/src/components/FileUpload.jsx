import { useState, useRef } from 'react'
import { Upload, File } from 'lucide-react'

export default function FileUpload({ onFileSelect, accept = '*' }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {selectedFile ? (
        <div className="flex items-center justify-center gap-2 text-gray-700">
          <File className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">{selectedFile.name}</span>
        </div>
      ) : (
        <div className="text-gray-500">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">Clicca o trascina un file</p>
          <p className="text-xs mt-1 text-gray-400">{accept}</p>
        </div>
      )}
    </div>
  )
}
