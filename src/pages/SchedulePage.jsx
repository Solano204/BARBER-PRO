// src/pages/SchedulePage.jsx
import React, { useState } from 'react'
import { Lock, CalendarX, Coffee, Trash2, Unlock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addDocument, deleteDocument } from '../firebase/firestore'
import { generateTimeSlots, formatDate, formatTime12h, getTodayStr } from '../utils/helpers'

export default function SchedulePage() {
  const { currentUser, appData, showToast } = useApp()
  const barberId = currentUser.barber_id || currentUser.id
  const myBlocks = appData.blockedSlots
    .filter((b) => b.barber_id === barberId)
    .sort((a, b) => b.date.localeCompare(a.date))

  const slots = generateTimeSlots()

  // Lunch block state
  const [lunchStart, setLunchStart] = useState('14:00')
  const [lunchEnd, setLunchEnd] = useState('15:00')

  // Custom block state
  const [blockDate, setBlockDate] = useState('')
  const [blockStart, setBlockStart] = useState('14:00')
  const [blockEnd, setBlockEnd] = useState('15:00')
  const [blockReason, setBlockReason] = useState('')

  const blockLunch = async () => {
    if (lunchStart >= lunchEnd) return showToast('La hora de fin debe ser mayor al inicio', 'error')
    const today = getTodayStr()
    const already = myBlocks.find((b) => b.date === today && b.time === `${lunchStart}-${lunchEnd}`)
    if (already) return showToast('Este horario ya estaba bloqueado', 'warning')
    try {
      await addDocument('blockedSlots', { barber_id: barberId, date: today, time: `${lunchStart}-${lunchEnd}`, reason: 'Hora de Comida' })
      showToast('¡Hora de comida bloqueada para hoy!', 'success')
    } catch { showToast('Error al bloquear', 'error') }
  }

  const blockCustom = async () => {
    if (!blockDate) return showToast('Selecciona una fecha', 'error')
    try {
      await addDocument('blockedSlots', { barber_id: barberId, date: blockDate, time: `${blockStart}-${blockEnd}`, reason: blockReason || 'Ocupado' })
      showToast('Horario bloqueado', 'success')
      setBlockDate(''); setBlockReason('')
    } catch { showToast('Error al bloquear', 'error') }
  }

  const deleteBlock = async (id) => {
    if (!window.confirm('¿Eliminar este bloqueo y abrir tu agenda?')) return
    try { await deleteDocument('blockedSlots', id); showToast('Horario liberado', 'success') }
    catch { showToast('Error', 'error') }
  }

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white uppercase tracking-wide">MI HORARIO</h1>
        <p className="text-zinc-400">Gestiona tus tiempos de descanso y bloqueos de agenda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block form */}
        <div className="glass rounded-2xl p-6 h-fit border border-zinc-700/50">
          <h2 className="font-display text-xl text-white mb-4">BLOQUEAR ESPACIO</h2>

          {/* Quick lunch */}
          <div className="mb-6 p-5 rounded-xl" style={{ background: 'color-mix(in srgb, var(--brand-color) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-color) 20%, transparent)' }}>
            <p className="text-sm font-medium flex items-center gap-2 mb-3" style={{ color: 'var(--brand-color)' }}>
              <Coffee className="w-4 h-4" /> Bloquear Hora de Comida (Hoy)
            </p>
            <div className="flex items-center gap-3 mb-4">
              <select value={lunchStart} onChange={(e) => setLunchStart(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-lg text-white focus:border-[color:var(--brand-color)] outline-none">
                {slots.map((t) => <option key={t} value={t}>{formatTime12h(t)}</option>)}
              </select>
              <span className="text-zinc-500 font-medium shrink-0">a</span>
              <select value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-lg text-white focus:border-[color:var(--brand-color)] outline-none">
                {slots.map((t) => <option key={t} value={t}>{formatTime12h(t)}</option>)}
              </select>
            </div>
            <button onClick={blockLunch} className="w-full bg-zinc-800 hover:bg-[color:var(--brand-color)] hover:text-zinc-900 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 border border-zinc-700">
              <Lock className="w-5 h-5" /> Bloquear para Hoy
            </button>
          </div>

          {/* Custom block */}
          <div className="space-y-4 border-t border-zinc-700/50 pt-6">
            <p className="text-sm text-zinc-400 font-medium">Bloqueo Personalizado (Cualquier día)</p>
            <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)}
              className="w-full bg-zinc-700/50 border border-zinc-600 focus:border-[color:var(--brand-color)] p-3 rounded-xl text-white focus:outline-none [color-scheme:dark]" />
            <div className="grid grid-cols-2 gap-4">
              <select value={blockStart} onChange={(e) => setBlockStart(e.target.value)}
                className="w-full bg-zinc-700/50 border border-zinc-600 p-3 rounded-xl text-white appearance-none">
                {slots.map((t) => <option key={t} value={t}>{formatTime12h(t)}</option>)}
              </select>
              <select value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)}
                className="w-full bg-zinc-700/50 border border-zinc-600 p-3 rounded-xl text-white appearance-none">
                {slots.map((t) => <option key={t} value={t}>{formatTime12h(t)}</option>)}
              </select>
            </div>
            <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Motivo (Ej. Cita médica, Asunto personal...)"
              className="w-full bg-zinc-700/50 border border-zinc-600 focus:border-[color:var(--brand-color)] p-3 rounded-xl text-white focus:outline-none" />
            <button onClick={blockCustom} className="w-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white py-3 rounded-xl font-bold transition flex justify-center items-center gap-2">
              <CalendarX className="w-4 h-4" /> Guardar Bloqueo
            </button>
          </div>
        </div>

        {/* Active blocks list */}
        <div className="glass rounded-2xl p-6 border border-zinc-700/50">
          <h2 className="font-display text-xl text-white mb-4">MIS BLOQUEOS ACTIVOS</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {myBlocks.length > 0 ? myBlocks.map((b) => {
              const formattedTime = b.time
                ? b.time.split('-').map((t) => formatTime12h(t)).join(' a ')
                : '--:--'
              return (
                <div key={b.id} className="bg-zinc-800/80 border border-zinc-700 p-4 rounded-xl flex items-center justify-between hover:border-red-500/30 transition">
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      {b.reason || 'Ocupado'}
                      {b.reason === 'Hora de Comida' && <Coffee className="w-4 h-4" style={{ color: 'var(--brand-color)' }} />}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">{formatDate(b.date)}</p>
                    <p className="text-xs text-red-400 mt-1 font-bold tracking-wider">{formattedTime}</p>
                  </div>
                  <button onClick={() => deleteBlock(b.id)} className="p-2 text-zinc-500 hover:text-red-400 transition bg-zinc-900 rounded-lg border border-transparent hover:border-red-500/30">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )
            }) : (
              <div className="text-center py-12">
                <Unlock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No tienes horarios bloqueados. Toda tu agenda está abierta.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
