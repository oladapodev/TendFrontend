// Avatar presets and client-side image compression for profile pictures.
export const AVATAR_PRESETS = [
  { id: 'guardian', label: 'Guardian', bg: '#D9F0E3', fg: '#006B3F', accent: '#008751', kind: 'portrait-scarf' },
  { id: 'doctor', label: 'Clinician', bg: '#E1ECF8', fg: '#1D4E89', accent: '#2563A8', kind: 'portrait-med' },
  { id: 'wellness', label: 'Active', bg: '#FDF1DC', fg: '#A86A12', accent: '#E9A23B', kind: 'portrait-sport' },
  { id: 'elder', label: 'Elder', bg: '#E6F4F1', fg: '#0F5257', accent: '#1F8A8C', kind: 'portrait-glasses' },
  { id: 'modern', label: 'Modern', bg: '#ECE6FA', fg: '#4E3792', accent: '#6B4FBB', kind: 'portrait-natural' },
  { id: 'caregiver', label: 'Caregiver', bg: '#FDE3E3', fg: '#A91D1D', accent: '#D62828', kind: 'portrait-warm' },
  { id: 'shield', label: 'TendShield', bg: '#008751', fg: '#FFFFFF', accent: '#BFE6D1', kind: 'emblem-shield' },
  { id: 'pulse', label: 'Vital Pulse', bg: '#0F1F17', fg: '#FFFFFF', accent: '#1FA46A', kind: 'emblem-pulse' },
]

export function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function getPresetByAvatar(value) {
  if (!value || !String(value).startsWith('preset:')) return null
  const id = String(value).slice('preset:'.length)
  return AVATAR_PRESETS.find((p) => p.id === id) || null
}

// Crop and resize an uploaded photo to a compact 256x256 square data URL so it saves cleanly in JSON & localStorage.
export async function processAvatarFile(file) {
  if (!file) throw new Error('No file selected.')
  if (!file.type?.startsWith('image/')) throw new Error('Please choose an image file (PNG, JPG, WebP, or GIF).')
  if (file.size > 10 * 1024 * 1024) throw new Error('Image must be smaller than 10 MB.')

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not read that image file. Try a PNG or JPG photo.'))
      el.src = url
    })

    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Browser canvas is unavailable.')

    const w = img.naturalWidth || img.width
    const h = img.naturalHeight || img.height
    const side = Math.min(w, h)
    const sx = (w - side) / 2
    const sy = (h - side) / 2

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)

    const webp = canvas.toDataURL('image/webp', 0.86)
    if (webp.startsWith('data:image/webp')) return webp
    return canvas.toDataURL('image/jpeg', 0.86)
  } finally {
    URL.revokeObjectURL(url)
  }
}

