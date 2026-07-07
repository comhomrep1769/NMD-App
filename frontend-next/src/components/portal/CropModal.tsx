'use client'

import { useState, useCallback } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

type CropModalProps = {
  imageSrc: string
  onCropDone: (croppedDataUrl: string) => void
  onCancel: () => void
}

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('No canvas context'))
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
      )
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    image.onerror = () => reject(new Error('Image load failed'))
    image.src = imageSrc
  })
}

export default function CropModal({ imageSrc, onCropDone, onCancel }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels)
      onCropDone(result)
    } catch (err) {
      console.error('Crop error:', err)
    }
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{
        background: 'white', borderRadius: 16, width: '90%',
        maxWidth: 480, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Crop Profile Photo</div>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#9CA3AF' }}
          >&times;</button>
        </div>

        <div style={{ position: 'relative', height: 320, background: '#111' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF', minWidth: 36 }}>Zoom</span>
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#0F766E' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '0.65rem', borderRadius: 8,
                border: '1px solid #E5E7EB', background: 'white',
                color: '#374151', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}
            >Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '0.65rem', borderRadius: 8,
                border: 'none', background: '#0F766E',
                color: 'white', fontWeight: 600, fontSize: '0.85rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                opacity: saving ? 0.7 : 1,
              }}
            >{saving ? 'Saving...' : 'Save Photo'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
