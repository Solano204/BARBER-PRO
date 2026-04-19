// src/pages/WalkInPage.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addDocument } from '../firebase/firestore'
import { getTodayStr } from '../utils/helpers'

export default function WalkInPage() {
  const { currentUser, appData, showToast } = useApp()
  const navigate = useNavigate()
  const [clientName, setClientName] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [loading, setLoading] = useState(false)

  const register = async () => {
    if (!serviceId) return showToast('Debes seleccionar un servicio', 'error')
    const now = new Date()
    const dateStr = getTodayStr()
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    setLoading(true)
    try {
      await addDocument('appointments', {
        service_name: serviceId,
        barber_id: currentUser.barber_id || currentUser.id,
        client_id: 'walk-in',
        branch_id: currentUser.branch_id || 'main',
        date: dateStr, time: timeStr,
        status: 'completed',
        notes: clientName || 'Cliente de paso',
        created_at: now.toISOString(),
      })
      showToast('¡Venta registrada con éxito!', 'success')
      navigate('/today')
    } catch { showToast('Error al registrar la venta', 'error') }
    finally { setLoading(false) }
  }

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-white mb-2">VENTA DIRECTA</h1>
        <p className="text-zinc-400">Registra un cliente que llegó sin cita. Se guardará como completado al instante.</p>
      </div>

      <div className="max-w-2xl">
        <div className="glass rounded-2xl p-6 lg:p-8 border border-[color:var(--brand-color)]/20 space-y-8">

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand-color)' }}>
              1. NOMBRE DEL CLIENTE (Opcional)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej: Cliente de paso"
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-4 px-4 text-white focus:border-[color:var(--brand-color)] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--brand-color)' }}>
              2. SERVICIO REALIZADO
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {appData.services.map((svc) => (
                <label key={svc.id} className="cursor-pointer">
                  <input type="radio" name="walkin-svc" value={svc.id}
                    checked={serviceId === svc.id}
                    onChange={() => setServiceId(svc.id)}
                    className="hidden peer" />
                  <div className="bg-zinc-800/50 peer-checked:bg-[color:var(--brand-color)]/20 peer-checked:border-[color:var(--brand-color)] border border-zinc-700 rounded-xl p-4 transition hover:bg-zinc-700/50">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">{svc.name}</p>
                      <span className="font-display text-xl" style={{ color: 'var(--brand-color)' }}>${svc.price}</span>
                    </div>
                  </div>
                </label>
              ))}
              {appData.services.length === 0 && (
                <p className="text-zinc-500 text-sm">No hay servicios disponibles.</p>
              )}
            </div>
          </div>

          <button
            onClick={register}
            disabled={loading || !serviceId}
            className="w-full gradient-gold text-zinc-900 font-bold py-4 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <div className="w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              : <><CheckCircle className="w-6 h-6" /><span className="text-lg">Registrar y Cobrar Venta</span></>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
