// src/pages/BookingPage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, Store, User, Calendar, Clock, CalendarCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addDocument } from '../firebase/firestore'
import { generateTimeSlots, formatDate, formatTime12h } from '../utils/helpers'

export default function BookingPage() {
  const { currentUser, appData, showToast } = useApp()
  const navigate = useNavigate()

  const [branchId, setBranchId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [barberId, setBarberId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [availableTimes, setAvailableTimes] = useState([])
  const [loading, setLoading] = useState(false)

  const defaultBranchId = currentUser?.branch_id ||
    (appData.branches.length > 0 ? appData.branches[0].id : 'main')

  useEffect(() => {
    setBranchId(defaultBranchId)
  }, [defaultBranchId])

  const filteredBarbers = appData.barbers.filter(
    (b) => b.branch_id === branchId || (!b.branch_id && branchId === 'main')
  )

  useEffect(() => {
    if (!barberId || !date) { setAvailableTimes([]); setTime(''); return }
    const allSlots = generateTimeSlots()
    const occupied = appData.appointments
      .filter((a) => a.barber_id === barberId && a.date === date && a.status !== 'cancelled')
      .map((a) => a.time)
    const blocked = appData.blockedSlots.filter((b) => b.barber_id === barberId && b.date === date)
    const available = allSlots.filter((slot) => {
      if (occupied.includes(slot)) return false
      return !blocked.some((b) => {
        const [start, end] = b.time.split('-')
        return start && end && slot >= start && slot < end
      })
    })
    setAvailableTimes(available)
    setTime('')
  }, [barberId, date, appData.appointments, appData.blockedSlots])

  const selectedService = appData.services.find((s) => s.id === serviceId)
  const selectedBarber = appData.barbers.find((b) => b.id === barberId)
  const selectedBranch = appData.branches.find((b) => b.id === branchId) || { branch_name: 'Sucursal Principal' }
  const isComplete = serviceId && barberId && date && time

  const handleConfirm = async () => {
    if (!isComplete) return showToast('Completa todos los campos', 'error')
    const conflict = appData.appointments.find(
      (a) => a.barber_id === barberId && a.date === date && a.time === time && a.status !== 'cancelled'
    )
    if (conflict) return showToast('¡Ese horario acaba de ser tomado! Elige otro.', 'error')

    setLoading(true)
    try {
      await addDocument('appointments', {
        branch_id: branchId || 'main',
        service_name: serviceId,
        barber_id: barberId,
        client_id: currentUser.id,
        date, time,
        status: 'pending',
        notes: currentUser.name,
        created_at: new Date().toISOString(),
      })
      showToast('¡Cita reservada exitosamente!', 'success')
      navigate('/my-appointments')
    } catch {
      showToast('Error al reservar la cita', 'error')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-white mb-2">RESERVAR CITA</h1>
        <p className="text-zinc-400">Selecciona sucursal, servicio, barbero, fecha y hora</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="glass rounded-3xl p-6 lg:p-8 border border-zinc-700/50 shadow-xl space-y-8">

          {/* Branch */}
          <Section num="1" label="SUCURSAL">
            <div className="relative">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <select value={branchId} onChange={(e) => { setBranchId(e.target.value); setBarberId('') }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[color:var(--brand-color)] focus:outline-none appearance-none cursor-pointer">
                {appData.branches.length > 0
                  ? appData.branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name} - {b.branch_location}</option>)
                  : <option value="main">Sucursal Principal</option>
                }
              </select>
            </div>
          </Section>

          {/* Service */}
          <Section num="2" label="SERVICIO">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {appData.services.map((svc) => (
                <label key={svc.id} className="cursor-pointer">
                  <input type="radio" name="svc" value={svc.id} checked={serviceId === svc.id}
                    onChange={() => setServiceId(svc.id)} className="hidden peer" />
                  <div className="bg-zinc-800/80 peer-checked:bg-[color:var(--brand-color)]/20 peer-checked:border-[color:var(--brand-color)] border border-zinc-700 rounded-xl p-3 transition hover:bg-zinc-700/80">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Scissors className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white leading-tight">{svc.name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{svc.duration} min</p>
                        </div>
                      </div>
                      <span className="font-display text-xl" style={{ color: 'var(--brand-color)' }}>${svc.price}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Section>

          {/* Barber */}
          <Section num="3" label="BARBERO">
            {filteredBarbers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredBarbers.map((b) => (
                  <label key={b.id} className="cursor-pointer">
                    <input type="radio" name="barber" value={b.id} checked={barberId === b.id}
                      onChange={() => setBarberId(b.id)} className="hidden peer" />
                    <div className="bg-zinc-800/80 peer-checked:bg-[color:var(--brand-color)]/20 peer-checked:border-[color:var(--brand-color)] border border-zinc-700 rounded-xl p-4 text-center transition hover:bg-zinc-700/80">
                      <div className="w-12 h-12 bg-zinc-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <User className="w-6 h-6 text-zinc-400" />
                      </div>
                      <p className="font-medium text-white text-sm truncate">{b.name}</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm py-4 text-center bg-zinc-800/50 rounded-xl">No hay barberos en esta sucursal.</p>
            )}
          </Section>

          {/* Date & Time */}
          <Section num="4" label="FECHA Y HORA">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 uppercase tracking-widest font-bold mb-2">Fecha</label>
                <input type="date" value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] focus:outline-none [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 uppercase tracking-widest font-bold mb-2">Hora Disponible</label>
                <select value={time} onChange={(e) => setTime(e.target.value)}
                  disabled={availableTimes.length === 0}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-400 focus:border-[color:var(--brand-color)] focus:outline-none disabled:opacity-50">
                  <option value="">Selecciona fecha y barbero</option>
                  {availableTimes.map((t) => <option key={t} value={t}>{formatTime12h(t)}</option>)}
                </select>
              </div>
            </div>
          </Section>

          {/* Summary */}
          {isComplete && selectedService && selectedBarber && (
            <div className="bg-zinc-800/80 rounded-2xl p-5 border border-[color:var(--brand-color)]/30 shadow-lg fade-in">
              <h4 className="font-display text-xl text-white mb-3 border-b border-zinc-700 pb-2">RESUMEN DE TU CITA</h4>
              <div className="space-y-2 text-sm">
                <Row label="Sucursal" value={selectedBranch.branch_name} />
                <Row label="Servicio" value={selectedService.name} />
                <Row label="Barbero" value={selectedBarber.name} />
                <Row label="Fecha" value={formatDate(date)} />
                <Row label="Hora" value={formatTime12h(time)} gold />
                <div className="border-t border-zinc-700 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold uppercase tracking-widest text-xs" style={{ color: 'var(--brand-color)' }}>Total:</span>
                  <span className="font-display text-3xl" style={{ color: 'var(--brand-color)' }}>${selectedService.price}</span>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleConfirm} disabled={!isComplete || loading}
            className="w-full gradient-gold text-zinc-900 font-bold py-4 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
            {loading
              ? <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              : <><CalendarCheck className="w-5 h-5" /><span>Confirmar Reserva</span></>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ num, label, children }) {
  return (
    <div>
      <h3 className="font-display text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--brand-color)' }}>
        <span className="w-6 h-6 text-zinc-900 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--brand-color)' }}>{num}</span>
        {label}
      </h3>
      {children}
    </div>
  )
}

function Row({ label, value, gold }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-400">{label}:</span>
      <span className={gold ? 'font-bold' : 'text-white font-medium'} style={gold ? { color: 'var(--brand-color)' } : {}}>{value}</span>
    </div>
  )
}
