// src/utils/helpers.js

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

export const formatTime12h = (time24) => {
  if (!time24) return '--:--'
  const [hourStr, minStr] = time24.split(':')
  let h = parseInt(hourStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${String(h).padStart(2, '0')}:${minStr} ${ampm}`
}

export const getTodayStr = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export const getStatusColor = (s) => ({
  pending:   'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
}[s] || 'bg-zinc-500/20 text-zinc-400')

export const getStatusLabel = (s) => ({
  pending:   'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
}[s] || s)

export const getRoleLabel = (role) => ({
  admin:  'Administrador',
  barber: 'Barbero',
  client: 'Cliente',
}[role] || role)

export const generateTimeSlots = () => {
  const slots = []
  for (let h = 9; h <= 19; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 19) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

export const getServicePrice = (serviceId, services) => {
  const s = services.find((srv) => srv.id === serviceId)
  return s ? Number(s.price) : 0
}

export const formatDateForInput = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const shadeHexColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16)
  let G = parseInt(color.substring(3, 5), 16)
  let B = parseInt(color.substring(5, 7), 16)
  R = Math.min(255, parseInt((R * (100 + percent)) / 100))
  G = Math.min(255, parseInt((G * (100 + percent)) / 100))
  B = Math.min(255, parseInt((B * (100 + percent)) / 100))
  return '#' + [R, G, B].map((v) => v.toString(16).padStart(2, '0')).join('')
}

export const compressImage = (file, maxWidth = 300) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = maxWidth / img.width
        canvas.width = maxWidth
        canvas.height = img.height * scale
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
