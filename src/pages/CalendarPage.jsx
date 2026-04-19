// src/pages/CalendarPage.jsx
import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarX } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate, getStatusColor, getStatusLabel } from '../utils/helpers'

function getCalendarDates(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  let dow = firstDay.getDay()
  dow = dow === 0 ? 6 : dow - 1 // Monday-first
  const start = new Date(year, month, 1 - dow)
  return Array.from({ length: 42 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  )
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

export default function CalendarPage() {
  const { currentUser, appData, showModal, closeModal } = useApp()
  const [selectedDate, setSelectedDate] = useState(new Date())

  const todayObj = new Date()
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth()+1).padStart(2,'0')}-${String(todayObj.getDate()).padStart(2,'0')}`

  let validApts = appData.appointments.filter((a) => a.status !== 'cancelled')
  if (currentUser.role === 'barber') {
    validApts = validApts.filter((a) => a.barber_id === currentUser.barber_id || a.barber_id === currentUser.id)
  }

  const changeMonth = (delta) => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + delta, 1))
  const goToday = () => setSelectedDate(new Date())

  const selectDay = (dateStr) => {
    let dayApts = validApts.filter((a) => a.date === dateStr)
    showModal(
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-white uppercase tracking-wide">Citas del {formatDate(dateStr)}</h2>
          <button onClick={closeModal} className="p-2 text-zinc-400 hover:text-white transition">✕</button>
        </div>
        {dayApts.length > 0 ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {dayApts.map((apt) => {
              const svc = appData.services.find((s) => s.id === apt.service_name) || { name: apt.service_name }
              const barber = appData.barbers.find((b) => b.id === apt.barber_id) || { name: 'Barbero' }
              return (
                <div key={apt.id} className="bg-zinc-700/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-zinc-700/50">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="font-display text-xl" style={{ color: 'var(--brand-color)' }}>{apt.time}</p>
                    </div>
                    <div className="w-px h-10 bg-zinc-600 hidden md:block" />
                    <div>
                      <p className="font-medium text-white text-lg">{apt.notes || 'Cliente'}</p>
                      <p className="text-sm text-zinc-400">{svc.name} • {barber.name}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium self-start md:self-auto ${getStatusColor(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
            <CalendarX className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">No hay citas programadas para este día</p>
          </div>
        )}
      </div>
    )
  }

  const dates = getCalendarDates(selectedDate)

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-white uppercase tracking-wide">CALENDARIO</h1>
          <p className="text-zinc-400 text-lg">{MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={goToday} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition">Hoy</button>
          <button onClick={() => changeMonth(1)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="border border-zinc-800/50 rounded-2xl p-2 md:p-4 bg-zinc-900/40 flex-1">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] md:text-sm text-zinc-400 font-medium py-1 md:py-2 truncate">{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1 md:gap-2" style={{ gridAutoRows: '1fr' }}>
          {dates.map((date) => {
            const ds = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
            const isToday = ds === todayStr
            const isCurMonth = date.getMonth() === selectedDate.getMonth()
            const dayApts = validApts.filter((a) => a.date === ds)

            return (
              <div
                key={ds}
                onClick={() => selectDay(ds)}
                className={`bg-[#1c1c1e] hover:bg-[#2a2a2c] rounded-lg md:rounded-xl p-1 md:p-3 flex flex-col items-center md:items-start cursor-pointer transition min-h-[50px] md:min-h-[100px] ${isToday ? 'border' : 'border border-transparent'}`}
                style={isToday ? { borderColor: 'var(--brand-color)' } : {}}
              >
                <span className={`text-[11px] md:text-sm ${isToday ? 'font-bold' : isCurMonth ? 'text-white font-medium' : 'text-zinc-600'}`}
                  style={isToday ? { color: 'var(--brand-color)' } : {}}>
                  {date.getDate()}
                </span>
                <div className="mt-auto pt-1 w-full flex justify-center md:justify-start">
                  {dayApts.length > 0 && (
                    <>
                      <div className="block md:hidden w-1.5 h-1.5 rounded-full mt-1" style={{ background: 'var(--brand-color)', boxShadow: '0 0 5px var(--brand-color)' }} />
                      <div className="hidden md:block text-[10px] md:text-xs px-2 py-1 rounded-md truncate font-medium border w-full text-left"
                        style={{ background: 'color-mix(in srgb, var(--brand-color) 10%, transparent)', color: 'var(--brand-color)', borderColor: 'color-mix(in srgb, var(--brand-color) 20%, transparent)' }}>
                        {dayApts.length} cita{dayApts.length > 1 ? 's' : ''}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
