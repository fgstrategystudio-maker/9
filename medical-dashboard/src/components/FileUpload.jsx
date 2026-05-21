import React, { useRef } from 'react'
import { Upload, Camera } from 'lucide-react'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 4MB before compression kicks in

function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      // scale down so longest side ≤ 2000px
      const maxDim = 2000
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            const dataUrl = e.target.result
            resolve({ dataUrl, base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' })
          }
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        0.82,
      )
    }
    img.src = url
  })
}

export default function FileUpload({ onFileSelect, accept = '.pdf,image/*' }) {
  const inputRef = useRef()
  const cameraRef = useRef()

  const handleFile = async (file) => {
    if (!file) return

    let base64, dataUrl, mediaType

    if (file.type.startsWith('image/') && file.size > MAX_IMAGE_BYTES) {
      // compress large images before sending
      const compressed = await compressImage(file)
      base64 = compressed.base64
      dataUrl = compressed.dataUrl
      mediaType = compressed.mediaType
    } else {
      const result = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(file)
      })
      dataUrl = result
      base64 = result.split(',')[1]
      mediaType = file.type
    }

    onFileSelect({ file, base64, dataUrl, mediaType, filename: file.name })
  }

  const onDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <Upload size={22} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Trascina un file o clicca per selezionarlo</p>
        <p className="text-xs text-gray-400 mt-1">PDF · PNG · JPG (compressione automatica)</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      <button
        type="button"
        onClick={() => cameraRef.current.click()}
        className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 bg-white hover:bg-gray-50 hover:border-blue-400 transition-colors"
      >
        <Camera size={16} className="text-gray-500" />
        Scatta foto
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </button>
    </div>
  )
}
