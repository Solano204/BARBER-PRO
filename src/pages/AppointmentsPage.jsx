// src/pages/AppointmentsPage.jsx
import React from 'react'
import { Check, CheckCheck, X, MessageCircle, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { updateDocument, deleteDocument } from '../firebase/firestore'
import { getTodayStr, formatDate, formatTime12h, getStatusColor, getStatusLabel } from '../utils/helpers'

// ─── TODAY (barber) ───────────────────────────────────────────────────────────
export function TodayPage() {
  const { currentUser, appData, showToast } = useApp()
  const today = getTodayStr()

  const todayApts = appData.appointments
    .filter((a) =>
      a.date === today &&
      (a.barber_id === currentUser.barber_id || a.barber_id === currentUser.id) &&
      a.status !== 'cancelled'
    )
    .sort((a, b) => a.time.localeCompare(b.time))

  const updateStatus = async (id, status) => {
    try { await updateDocument('appointments', id, { status }); showToast('Actualizado', 'success') }
    catch { showToast('Error', 'error') }
  }

  const sendWhatsApp = (apt) => {
    if (apt.client_id === 'walk-in') return showToast('No hay teléfono para clientes directos', 'warning')
    const client = appData.users.find((u) => u.id === apt.client_id)
    if (!client?.phone) return showToast('Este cliente no registró teléfono', 'error')
    const phone = client.phone.replace(/[^0-9+]/g, '')
    const barber = appData.barbers.find((b) => b.id === apt.barber_id)
    const msg = encodeURIComponent(`¡Hola ${client.name.split(' ')[0]}! 💈 Te recordamos tu cita para HOY a las ${apt.time} con ${barber?.name || 'tu barbero'}. ¡Te esperamos!`)
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">CITAS DE HOY</h1>
        <p className="text-zinc-400">{formatDate(today)}</p>
      </div>
      <div className="glass rounded-2xl p-6">
        {todayApts.length > 0 ? (
          <div className="space-y-4">
            {todayApts.map((apt) => {
              const svc = appData.services.find((s) => s.id === apt.service_name) || { name: apt.service_name }
              const isWalkIn = apt.client_id === 'walk-in'
              return (
                <div key={apt.id} className="bg-zinc-700/30 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-transparent hover:border-zinc-600 transition">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="font-display text-2xl" style={{ color: 'var(--brand-color)' }}>{apt.time}</p>
                    </div>
                    <div className="w-px h-12 bg-zinc-600 hidden md:block" />
                    <div>
                      <p className="font-medium text-white text-lg flex items-center gap-1">
                        {apt.notes || 'Cliente'}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ml-1 ${isWalkIn ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {isWalkIn ? 'Directo' : 'Cita'}
                        </span>
                      </p>
                      <p className="text-zinc-400">{svc.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                    {!isWalkIn && apt.status !== 'completed' && (
                      <button onClick={() => sendWhatsApp(apt)} className="p-2 text-green-400 bg-green-400/10 hover:bg-green-400/20 rounded-lg transition" title="WhatsApp">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    )}
                    {apt.status === 'pending' && (
                      <button onClick={() => updateStatus(apt.id, 'confirmed')} className="p-2 text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 rounded-lg transition" title="Confirmar">
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <button onClick={() => updateStatus(apt.id, 'completed')} className="p-2 bg-[color:var(--brand-color)]/10 hover:bg-[color:var(--brand-color)]/20 rounded-lg transition" style={{ color: 'var(--brand-color)' }} title="Completar">
                        <CheckCheck className="w-5 h-5" />
                      </button>
                    )}
                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      <button onClick={() => updateStatus(apt.id, 'cancelled')} className="p-2 text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition" title="Cancelar">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-400">Día libre, no hay citas hoy.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ALL APPOINTMENTS (admin) ─────────────────────────────────────────────────
export function AllAppointmentsPage() {
  const { appData, showToast } = useApp()

  const allApts = [...appData.appointments].sort((a, b) =>
    new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'))
  )

  const deleteApt = async (id, status) => {
    const msg = status === 'completed'
      ? '⚠️ Esta cita está COMPLETADA. Al eliminarla se restará de tus ingresos. ¿Continuar?'
      : '¿Eliminar esta cita permanentemente?'
    if (!window.confirm(msg)) return
    try { await deleteDocument('appointments', id); showToast('Cita eliminada', 'success') }
    catch { showToast('Error al eliminar', 'error') }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in">
      <div className="mb-6 md:mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-white uppercase tracking-wide">TODAS LAS CITAS</h1>
        <p className="text-zinc-400 mt-1">Historial completo de reservas y ventas</p>
      </div>

      <div className="glass rounded-2xl p-4 md:p-6">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="text-zinc-400 border-b border-zinc-700 text-xs uppercase tracking-widest">
              <tr>
                <th className="pb-4 px-4">Fecha y Hora</th>
                <th className="pb-4 px-4">Cliente</th>
                <th className="pb-4 px-4">Servicio</th>
                <th className="pb-4 px-4">Barbero</th>
                <th className="pb-4 px-4 text-right">Estado / Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {allApts.map((apt) => {
                const svc = appData.services.find((s) => s.id === apt.service_name) || { name: 'Eliminado' }
                const barber = appData.barbers.find((b) => b.id === apt.barber_id) || { name: 'No asignado' }
                const clientName = apt.client_id === 'walk-in' ? apt.notes || 'Cliente Directo' : apt.notes || 'Cliente'
                const isWalkIn = apt.client_id === 'walk-in'
                return (
                  <tr key={apt.id} className="text-white hover:bg-zinc-800/30 transition">
                    <td className="py-4 px-4">
                      <div className="font-medium">{formatDate(apt.date)}</div>
                      <div className="text-xs font-bold tracking-widest mt-1" style={{ color: 'var(--brand-color)' }}>{apt.time}</div>
                    </td>
                    <td className="py-4 px-4 font-medium">
                      {clientName}
                      {isWalkIn && <span className="text-[10px] text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded uppercase font-bold ml-2">Directo</span>}
                    </td>
                    <td className="py-4 px-4 text-zinc-300">{svc.name}</td>
                    <td className="py-4 px-4 text-zinc-400">{barber.name}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                        <button onClick={() => deleteApt(apt.id, apt.status)} className="p-2 text-zinc-500 hover:text-red-400 transition bg-zinc-900/50 rounded-lg border border-zinc-700 hover:border-red-500/30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {allApts.map((apt) => {
            const svc = appData.services.find((s) => s.id === apt.service_name) || { name: 'Eliminado' }
            const barber = appData.barbers.find((b) => b.id === apt.barber_id) || { name: 'No asignado' }
            const clientName = apt.client_id === 'walk-in' ? apt.notes || 'Cliente Directo' : apt.notes || 'Cliente'
            const isWalkIn = apt.client_id === 'walk-in'
            return (
              <div key={apt.id} className="bg-zinc-800/60 border border-zinc-700/50 p-4 rounded-xl relative">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-display text-2xl" style={{ color: 'var(--brand-color)' }}>{apt.time}</p>
                    <p className="text-xs text-zinc-400 mt-1">{formatDate(apt.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                    <button onClick={() => deleteApt(apt.id, apt.status)} className="p-2 text-zinc-400 hover:text-red-400 bg-zinc-900/80 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-white font-medium text-lg">{clientName}{isWalkIn && <span className="text-purple-400 text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded ml-1 uppercase font-bold">Directo</span>}</p>
                <p className="text-sm text-zinc-300 mt-1">{svc.name}</p>
                <p className="text-xs text-zinc-400 mt-2">{barber.name}</p>
              </div>
            )
          })}
        </div>

        {allApts.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p>No hay citas ni ventas registradas.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MY APPOINTMENTS (client) ─────────────────────────────────────────────────
export function MyAppointmentsPage() {
  const { currentUser, appData, showToast, showModal, closeModal } = useApp()

  const myApts = appData.appointments
    .filter((a) => a.client_id === currentUser.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const upcoming = myApts.filter((a) => new Date(a.date) >= new Date() && a.status !== 'cancelled')

  const cancelApt = (id) => {
    showModal(
      <div className="p-6 text-center">
        <h2 className="font-display text-2xl text-white mb-4">¿Cancelar Cita?</h2>
        <div className="flex gap-4">
          <button onClick={closeModal} className="flex-1 bg-zinc-700 py-3 rounded-xl text-white">No</button>
          <button onClick={async () => {
            await updateDocument('appointments', id, { status: 'cancelled' })
            showToast('Cita cancelada', 'success')
            closeModal()
          }} className="flex-1 bg-red-500 py-3 rounded-xl text-white">Sí, Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-white mb-2">MIS CITAS</h1>
        <p className="text-zinc-400">Gestiona tus citas programadas</p>
      </div>
      <div className="glass rounded-2xl p-6">
        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map((apt) => {
              const svc = appData.services.find((s) => s.id === apt.service_name) || { name: apt.service_name, price: 0 }
              const barber = appData.barbers.find((b) => b.id === apt.barber_id) || { name: 'Barbero' }
              return (
                <div key={apt.id} className="bg-zinc-700/30 rounded-xl p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 gradient-gold rounded-xl flex items-center justify-center flex-shrink-0">
                        <Scissors className="w-7 h-7 text-zinc-900" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl text-white">{svc.name}</h3>
                        <p className="text-zinc-400">con {barber.name}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-zinc-400">
                          <span>{formatDate(apt.date)}</span>
                          <span>{apt.time}</span>
                          <span style={{ color: 'var(--brand-color)' }}>${svc.price}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <button onClick={() => cancelApt(apt.id)} className="p-2 text-zinc-400 hover:text-red-400 transition">
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="font-display text-xl text-white mb-4">No tienes citas programadas</h3>
          </div>
        )}
      </div>
    </div>
  )
}

// fix missing import
import { Scissors } from 'lucide-react'
