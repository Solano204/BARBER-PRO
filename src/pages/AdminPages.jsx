// src/pages/AdminPages.jsx
// All remaining admin/misc pages bundled together for easy import
import React, { useState, useEffect, useRef } from 'react'
import { Trash2, Edit2, Plus, Receipt, Printer, RotateCcw, Coins, List, Calculator, ChevronLeft, ChevronRight, Users, Mail, Key, User, Store, MapPin, Phone, Palette, Save, Scissors, Percent, History as HistoryIcon, ShoppingBag } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addDocument, updateDocument, deleteDocument, saveBranding } from '../firebase/firestore'
import { formatDate, formatTime12h, getTodayStr, formatDateForInput, compressImage, getStatusColor, getStatusLabel } from '../utils/helpers'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase/config'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

// ════════════════════════════════════════════════════════════════
// PAYROLL
// ════════════════════════════════════════════════════════════════
export function PayrollPage() {
  const { currentUser, appData, showToast, showModal, closeModal } = useApp()

  const getWeekRange = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const start = new Date(today); start.setDate(diff)
    const end = new Date(start); end.setDate(start.getDate() + 6)
    return { start: formatDateForInput(start), end: formatDateForInput(end) }
  }

  const [startDate, setStartDate] = useState(getWeekRange().start)
  const [endDate, setEndDate] = useState(getWeekRange().end)

  const setRange = (type) => {
    const today = new Date()
    if (type === 'today') { const s = formatDateForInput(today); setStartDate(s); setEndDate(s) }
    else if (type === 'week') { const r = getWeekRange(); setStartDate(r.start); setEndDate(r.end) }
    else if (type === 'month') {
      setStartDate(formatDateForInput(new Date(today.getFullYear(), today.getMonth(), 1)))
      setEndDate(formatDateForInput(new Date(today.getFullYear(), today.getMonth() + 1, 0)))
    }
  }

  const sales = appData.appointments.filter((a) => a.status === 'completed' && a.date >= startDate && a.date <= endDate)

  let totalBruto = 0, totalShop = 0, totalPaid = 0, totalPending = 0

  const payrollData = appData.barbers.map((barber) => {
    const bSales = sales.filter((a) => a.barber_id === barber.id)
    const commission = barber.commission || 50
    let generated = 0, alreadyPaid = 0

    bSales.forEach((sale) => {
      const svc = appData.services.find((s) => s.id === sale.service_name)
      if (svc) {
        generated += Number(svc.price)
        if (sale.payout_status === 'paid') alreadyPaid += (Number(svc.price) * commission) / 100
      }
    })
    const barberCut = (generated * commission) / 100
    const shopCut = generated - barberCut
    const pending = barberCut - alreadyPaid

    totalBruto += generated; totalShop += shopCut; totalPaid += alreadyPaid; totalPending += pending

    return { id: barber.id, name: barber.name, commission, servicesDone: bSales.length, generated, barberCut, shopCut, alreadyPaid, pending }
  })

  const cashInRegister = totalBruto - totalPaid

  const processPayment = async (barberId, barberName) => {
    const unpaid = sales.filter((a) => a.barber_id === barberId && a.payout_status !== 'paid')
    if (unpaid.length === 0) return showToast('No hay cortes pendientes', 'warning')
    if (!window.confirm(`¿Confirmar pago a ${barberName} por ${unpaid.length} cortes?`)) return
    try {
      for (const s of unpaid) await updateDocument('appointments', s.id, { payout_status: 'paid', paid_at: new Date().toISOString() })
      showToast(`Pago a ${barberName} registrado`, 'success')
    } catch { showToast('Error al registrar pago', 'error') }
  }

  const undoPayment = async (barberId, barberName) => {
    const paid = sales.filter((a) => a.barber_id === barberId && a.payout_status === 'paid')
    if (paid.length === 0) return
    if (!window.confirm(`¿Revertir pago de ${barberName}?`)) return
    for (const s of paid) await updateDocument('appointments', s.id, { payout_status: 'pending' })
    showToast('Pago revertido', 'success')
  }

  const showCommissionModal = (barber, curr) => {
    let val = curr
    showModal(
      <div className="p-6">
        <div className="flex justify-between mb-6"><h2 className="font-display text-2xl text-white uppercase">COMISIÓN DE {barber.name.toUpperCase()}</h2><button onClick={closeModal}>✕</button></div>
        <div className="mb-6 text-center">
          <input type="number" defaultValue={curr} onChange={(e) => { val = e.target.value }}
            className="w-32 bg-zinc-800 border border-[color:var(--brand-color)]/50 rounded-xl py-3 px-4 font-display text-3xl text-center outline-none" style={{ color: 'var(--brand-color)' }} />
          <span className="font-display text-3xl ml-2" style={{ color: 'var(--brand-color)' }}>%</span>
        </div>
        <button onClick={async () => { await updateDocument('barbers', barber.id, { commission: Number(val) }); closeModal(); showToast('Comisión actualizada', 'success') }}
          className="w-full gradient-gold text-zinc-900 py-4 rounded-xl font-bold flex justify-center items-center gap-2">
          <Calculator className="w-5 h-5" /> Guardar y Recalcular
        </button>
      </div>
    )
  }

  const showBreakdown = (barberId, barberName) => {
    const bData = payrollData.find((d) => d.id === barberId)
    const bSales = sales.filter((a) => a.barber_id === barberId).sort((a,b) => new Date(b.date+'T'+b.time)-new Date(a.date+'T'+a.time))
    const commission = appData.barbers.find((b) => b.id === barberId)?.commission || 50
    showModal(
      <div className="p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div><h2 className="font-display text-2xl text-white uppercase">CORTES DE {barberName.toUpperCase()}</h2>
          <p className="text-zinc-400 text-sm">Del {formatDate(startDate)} al {formatDate(endDate)}</p></div>
          <button onClick={closeModal} className="p-2 text-zinc-400 hover:text-white">✕</button>
        </div>
        <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-1 pb-4">
          {bSales.map((s) => {
            const svc = appData.services.find((sv) => sv.id === s.service_name) || { name: 'Eliminado', price: 0 }
            const cut = (Number(svc.price) * commission) / 100
            return (
              <div key={s.id} className="bg-zinc-800/80 border border-zinc-700/50 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-white font-medium">{svc.name} <span className="font-bold" style={{ color: 'var(--brand-color)' }}>${svc.price}</span></p>
                  <p className="text-zinc-400 text-sm">{formatDate(s.date)} • {s.time}</p>
                  <p className="text-zinc-500 text-xs">{s.notes || 'Cliente'} {s.client_id === 'walk-in' ? '(Directo)' : '(Reserva)'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Comisión</p>
                  <p className="font-display text-2xl text-green-400">+${cut.toFixed(2)}</p>
                </div>
              </div>
            )
          })}
          {bSales.length === 0 && <p className="text-center text-zinc-500 py-10">Sin cortes en este periodo.</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-5">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-white uppercase tracking-wide">CÁLCULO DE NÓMINAS</h1>
          <div className="flex flex-wrap gap-2 mt-3 mb-2">
            {['today','week','month'].map((t) => (
              <button key={t} onClick={() => setRange(t)} className="bg-zinc-800 hover:bg-[color:var(--brand-color)] hover:text-zinc-900 text-zinc-300 text-xs px-3 py-1.5 rounded-lg border border-zinc-700 transition font-bold">
                {t === 'today' ? 'Hoy' : t === 'week' ? 'Semanal' : 'Mensual'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 bg-zinc-800/80 p-2 rounded-xl border border-zinc-700/50">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-zinc-300 focus:outline-none [color-scheme:dark] px-2 text-sm" />
            <span className="font-bold" style={{ color: 'var(--brand-color)' }}>AL</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-zinc-300 focus:outline-none [color-scheme:dark] px-2 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Ingreso Bruto', value: `$${totalBruto.toFixed(2)}`, cls: 'border-zinc-700' },
            { label: 'Utilidad Barbería', value: `$${totalShop.toFixed(2)}`, cls: 'border-[color:var(--brand-color)]/30 bg-[color:var(--brand-color)]/10', gold: true },
            { label: 'Deuda Pendiente', value: `$${totalPending.toFixed(2)}`, cls: 'border-red-500/30 bg-red-500/10', red: true },
            { label: 'Dinero en Caja', value: `$${cashInRegister.toFixed(2)}`, cls: 'border-green-500/50 bg-green-500/20', green: true },
          ].map(({ label, value, cls, gold, red, green }) => (
            <div key={label} className={`bg-zinc-800 border ${cls} px-3 py-3 rounded-xl`}>
              <p className={`text-[9px] uppercase tracking-widest font-bold mb-1 ${gold ? '' : red ? 'text-red-400' : green ? 'text-green-400' : 'text-zinc-400'}`} style={gold ? { color: 'var(--brand-color)' } : {}}>{label}</p>
              <p className={`font-display text-xl ${gold ? '' : red ? 'text-red-400' : green ? 'text-green-400' : 'text-white'}`} style={gold ? { color: 'var(--brand-color)' } : {}}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-3xl border border-zinc-700/50 shadow-2xl">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-zinc-800/80 text-zinc-400 text-xs uppercase tracking-widest">
              <tr>
                {['Barbero','Comisión','Generado (Bruto)','Su Parte (Neto)','Acciones de Pago'].map((h) => (
                  <th key={h} className="px-4 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/30">
              {payrollData.map((d) => (
                <tr key={d.id} className="text-white hover:bg-zinc-800/50 transition">
                  <td className="py-4 px-4">
                    <p className="font-medium">{d.name}</p>
                    <button onClick={() => showBreakdown(d.id, d.name)} className="text-xs flex items-center gap-1 mt-1 font-medium" style={{ color: 'var(--brand-color)' }}>
                      <List className="w-3 h-3" /> Ver {d.servicesDone} cortes
                    </button>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button onClick={() => showCommissionModal(appData.barbers.find((b) => b.id === d.id), d.commission)}
                      className="flex items-center justify-center gap-2 mx-auto text-zinc-300 hover:text-white bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-600 transition">
                      <span className="font-bold">{d.commission}%</span> <Edit2 className="w-3 h-3" style={{ color: 'var(--brand-color)' }} />
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right font-medium">${d.generated.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right">
                    <p className="font-display text-xl text-white">${d.barberCut.toFixed(2)}</p>
                    <p className="text-xs text-zinc-400">Total a ganar</p>
                  </td>
                  <td className="py-4 px-4 w-44">
                    {d.pending > 0 && (
                      <button onClick={() => processPayment(d.id, d.name)}
                        className="w-full bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-3 py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1 mb-1 border border-green-500/30">
                        <Coins className="w-4 h-4" /> Pagar ${d.pending.toFixed(2)}
                      </button>
                    )}
                    {d.alreadyPaid > 0 && (
                      <button onClick={() => undoPayment(d.id, d.name)}
                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs transition flex items-center justify-center gap-1 border border-red-500/20">
                        <RotateCcw className="w-4 h-4" /> Revertir pago
                      </button>
                    )}
                    {d.servicesDone === 0 && <span className="text-zinc-500 text-xs">Sin actividad</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile payroll cards */}
        <div className="md:hidden p-4 space-y-4">
          {payrollData.map((d) => (
            <div key={d.id} className="bg-zinc-800/60 border border-zinc-700/50 p-4 rounded-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium text-lg">{d.name}</p>
                  <button onClick={() => showBreakdown(d.id, d.name)} className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--brand-color)' }}>
                    <List className="w-3 h-3" /> Ver {d.servicesDone} cortes
                  </button>
                </div>
                <button onClick={() => showCommissionModal(appData.barbers.find((b) => b.id === d.id), d.commission)}
                  className="flex flex-col items-center bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-600">
                  <span className="text-[10px] text-zinc-500 uppercase">Comisión</span>
                  <span className="font-bold" style={{ color: 'var(--brand-color)' }}>{d.commission}%</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-900/50 rounded-xl">
                <div><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Generado</p><p className="font-medium text-white">${d.generated.toFixed(2)}</p></div>
                <div className="text-right border-l border-zinc-700 pl-3"><p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Su Parte</p><p className="font-display text-2xl text-green-400">${d.barberCut.toFixed(2)}</p></div>
              </div>
              {d.pending > 0 && (
                <button onClick={() => processPayment(d.id, d.name)} className="w-full bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 border border-green-500/30">
                  <Coins className="w-5 h-5" /> Pagar ${d.pending.toFixed(2)}
                </button>
              )}
              {d.alreadyPaid > 0 && (
                <button onClick={() => undoPayment(d.id, d.name)} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 border border-red-500/20">
                  <RotateCcw className="w-5 h-5" /> Revertir
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// DAILY SALES
// ════════════════════════════════════════════════════════════════
export function DailySalesPage() {
  const { appData, showToast, showModal, closeModal } = useApp()
  const [targetDate, setTargetDate] = useState(getTodayStr())

  const changeDay = (d) => {
    const current = new Date(targetDate + 'T12:00:00')
    current.setDate(current.getDate() + d)
    setTargetDate(formatDateForInput(current))
  }

  const daySales = appData.appointments.filter((a) => a.date === targetDate && a.status === 'completed')
    .sort((a, b) => b.time.localeCompare(a.time))
  const totalRevenue = daySales.reduce((sum, apt) => {
    const svc = appData.services.find((s) => s.id === apt.service_name)
    return sum + (svc ? Number(svc.price) : 0)
  }, 0)

  const deleteSale = async (id) => {
    if (!window.confirm('¿Eliminar esta venta? Se restará de tus ingresos.')) return
    try { await deleteDocument('appointments', id); showToast('Venta eliminada', 'success') }
    catch { showToast('Error', 'error') }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-white uppercase tracking-wide">REGISTRO DE VENTAS</h1>
          <div className="flex items-center gap-2 mt-3 bg-zinc-800/80 p-2 rounded-xl border border-zinc-700/50">
            <button onClick={() => changeDay(-1)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition"><ChevronLeft className="w-5 h-5" /></button>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="bg-transparent text-white font-medium focus:outline-none [color-scheme:dark] px-2 text-center" />
            <button onClick={() => changeDay(1)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-[color:var(--brand-color)]/10 border border-[color:var(--brand-color)]/30 px-5 py-4 rounded-2xl">
          <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6 text-zinc-900" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--brand-color)' }}>Total del Día</p>
            <p className="font-display text-4xl" style={{ color: 'var(--brand-color)' }}>${totalRevenue}</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl border border-zinc-700/50 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-zinc-800/80 text-[color:var(--brand-color)] text-xs uppercase tracking-widest">
              <tr>
                {['Hora','Cliente / Origen','Servicio / Ingreso','Barbero','Acción'].map((h) => (
                  <th key={h} className="px-6 py-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/30">
              {daySales.length > 0 ? daySales.map((apt) => {
                const svc = appData.services.find((s) => s.id === apt.service_name) || { name: 'Eliminado', price: 0 }
                const barber = appData.barbers.find((b) => b.id === apt.barber_id) || { name: 'Borrado' }
                const isWalkIn = apt.client_id === 'walk-in'
                return (
                  <tr key={apt.id} className="text-white hover:bg-zinc-800/50 transition">
                    <td className="py-4 px-6 font-display text-xl" style={{ color: 'var(--brand-color)' }}>{apt.time}</td>
                    <td className="py-4 px-6">
                      <p className="font-medium">{apt.notes || 'Cliente'}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${isWalkIn ? 'text-purple-400 bg-purple-500/20' : 'text-blue-400 bg-blue-500/20'}`}>{isWalkIn ? 'Directo' : 'Cita'}</span>
                    </td>
                    <td className="py-4 px-6">{svc.name} <br /><span className="font-bold" style={{ color: 'var(--brand-color)' }}>${svc.price}</span></td>
                    <td className="py-4 px-6 text-zinc-300">{barber.name}</td>
                    <td className="py-4 px-6">
                      <button onClick={() => deleteSale(apt.id)} className="text-zinc-500 hover:text-red-400 transition bg-zinc-900 p-2 rounded-lg border border-zinc-700 hover:border-red-500/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={5} className="text-center py-12 text-zinc-500">No hay ventas en esta fecha</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// EXPENSES
// ════════════════════════════════════════════════════════════════
export function ExpensesPage() {
  const { currentUser, appData, showToast, showModal, closeModal } = useApp()
  const expenses = [...(appData.expenses || [])].sort((a, b) => new Date(b.date) - new Date(a.date))

  const today = new Date()
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date + 'T00:00:00')
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  })
  const totalMonth = monthExpenses.reduce((s, e) => s + Number(e.amount), 0)

  const openAdd = () => {
    const todayStr = getTodayStr()
    let desc = '', amount = '', cat = 'Insumos', date = todayStr
    showModal(
      <div className="p-6">
        <div className="flex items-center justify-between mb-6"><h2 className="font-display text-2xl text-white uppercase">REGISTRAR GASTO</h2><button onClick={closeModal}>✕</button></div>
        <div className="space-y-4 mb-6">
          <input placeholder="Descripción del gasto" onChange={(e) => { desc = e.target.value }}
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-red-400 outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Monto ($)" onChange={(e) => { amount = e.target.value }}
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-red-400 font-bold focus:border-red-400 outline-none" />
            <select onChange={(e) => { cat = e.target.value }} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white outline-none appearance-none">
              {['Insumos','Servicios','Renta','Mantenimiento','Otros'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <input type="date" defaultValue={todayStr} onChange={(e) => { date = e.target.value }}
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white outline-none [color-scheme:dark]" />
        </div>
        <button onClick={async () => {
          if (!desc || !amount || !date) return showToast('Completa todos los campos', 'error')
          await addDocument('expenses', { description: desc, amount: Number(amount), category: cat, date, created_at: new Date().toISOString(), branch_id: currentUser.branch_id || 'main' })
          closeModal(); showToast('Gasto registrado', 'success')
        }} className="w-full bg-red-500 hover:bg-red-400 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> Registrar Salida de Dinero
        </button>
      </div>
    )
  }

  const deleteExpense = async (id) => {
    if (!window.confirm('¿Eliminar este registro de gasto?')) return
    try { await deleteDocument('expenses', id); showToast('Gasto eliminado', 'success') }
    catch { showToast('Error', 'error') }
  }

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl text-white uppercase tracking-wide">GASTOS Y COMPRAS</h1>
          <p className="text-zinc-400">Control de flujo de caja y salidas de dinero</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-xl text-right">
            <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Total Este Mes</p>
            <p className="font-display text-2xl text-red-400">${totalMonth.toFixed(2)}</p>
          </div>
          <button onClick={openAdd} className="gradient-gold text-zinc-900 px-4 py-3 rounded-xl font-bold hover:opacity-90 flex items-center gap-2 shadow-lg">
            <Plus className="w-5 h-5" /> Registrar Gasto
          </button>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-zinc-700/50 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-zinc-800/80 text-zinc-400 text-xs uppercase tracking-widest">
              <tr>{['Fecha','Descripción','Categoría','Monto','Acción'].map((h) => <th key={h} className="px-6 py-4">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/30">
              {expenses.length > 0 ? expenses.map((e) => (
                <tr key={e.id} className="text-white hover:bg-zinc-800/50 transition">
                  <td className="py-4 px-6 text-zinc-400">{formatDate(e.date)}</td>
                  <td className="py-4 px-6 font-medium">{e.description}</td>
                  <td className="py-4 px-6"><span className="bg-zinc-700 px-2 py-1 rounded-md text-xs text-zinc-300 border border-zinc-600">{e.category}</span></td>
                  <td className="py-4 px-6 text-right font-display text-xl text-red-400">-${Number(e.amount).toFixed(2)}</td>
                  <td className="py-4 px-6 text-center">
                    <button onClick={() => deleteExpense(e.id)} className="text-zinc-500 hover:text-red-400 transition bg-zinc-900 p-2 rounded-lg border border-zinc-700 hover:border-red-500/30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : <tr><td colSpan={5} className="text-center py-12 text-zinc-500">No hay gastos registrados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PROMOTIONS (client)
// ════════════════════════════════════════════════════════════════
export function PromotionsPage() {
  const { appData } = useApp()
  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8"><h1 className="font-display text-3xl text-white mb-2">PROMOCIONES</h1><p className="text-zinc-400">Aprovecha nuestros descuentos especiales</p></div>
      {appData.promotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appData.promotions.map((p) => (
            <div key={p.id} className="glass rounded-2xl overflow-hidden hover:scale-[1.02] transition transform border border-[color:var(--brand-color)]/20 shadow-lg">
              <div className="gradient-gold p-6 text-center">
                <p className="font-display text-5xl text-zinc-900">{p.discount}%</p>
                <p className="text-zinc-900 font-bold uppercase tracking-widest text-xs mt-1">Descuento</p>
              </div>
              <div className="p-6">
                <p className="text-white mb-2 font-medium">{p.description}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-700/50">
                  <code className="font-mono font-bold px-3 py-1.5 rounded-lg border" style={{ color: 'var(--brand-color)', background: 'color-mix(in srgb, var(--brand-color) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--brand-color) 30%, transparent)' }}>{p.code}</code>
                  <p className="text-xs text-zinc-400">Vence: {formatDate(p.validUntil)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-800/30 rounded-2xl border border-zinc-700/50">
          <Percent className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-xl font-medium">No hay promociones activas por el momento</p>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PROMOTIONS ADMIN
// ════════════════════════════════════════════════════════════════
export function PromotionsAdminPage() {
  const { appData, showToast, showModal, closeModal } = useApp()
  const promos = appData.promotions || []

  const openForm = (p = null) => {
    let code = p?.code || '', desc = p?.description || '', discount = p?.discount || '', date = p?.validUntil || ''
    const isEdit = !!p
    showModal(
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-white uppercase">{isEdit ? 'EDITAR' : 'NUEVA'} PROMOCIÓN</h2>
          <button onClick={closeModal}>✕</button>
        </div>
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input defaultValue={code} onChange={(e) => { code = e.target.value.toUpperCase() }} placeholder="Código (Ej. VIP20)"
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 font-mono font-bold uppercase text-[color:var(--brand-color)] focus:border-[color:var(--brand-color)] outline-none" />
            <input type="number" defaultValue={discount} onChange={(e) => { discount = e.target.value }} placeholder="Descuento %"
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
          </div>
          <input defaultValue={desc} onChange={(e) => { desc = e.target.value }} placeholder="Descripción o condiciones"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
          <input type="date" defaultValue={date} onChange={(e) => { date = e.target.value }}
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white outline-none [color-scheme:dark]" />
        </div>
        <button onClick={async () => {
          if (!code || !desc || !discount || !date) return showToast('Todos los campos son obligatorios', 'error')
          const data = { code, description: desc, discount: Number(discount), validUntil: date }
          if (isEdit) { await updateDocument('promotions', p.id, data) } else { await addDocument('promotions', { ...data, created_at: new Date().toISOString() }) }
          closeModal(); showToast(isEdit ? 'Promoción actualizada' : 'Promoción creada', 'success')
        }} className="w-full gradient-gold text-zinc-900 py-4 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> {isEdit ? 'Actualizar' : 'Guardar Promoción'}
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl text-white tracking-wide uppercase">PROMOCIONES</h1>
        <button onClick={() => openForm()} className="gradient-gold text-zinc-900 px-4 py-2 rounded-xl font-bold hover:opacity-90 flex items-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" /> Crear Promoción
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos.map((p) => (
          <div key={p.id} className="glass rounded-2xl overflow-hidden group border border-zinc-700/50 relative hover:border-[color:var(--brand-color)]/30 transition">
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button onClick={() => openForm(p)} className="bg-zinc-900/80 hover:bg-[color:var(--brand-color)] hover:text-zinc-900 text-white p-2 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (window.confirm('¿Eliminar?')) { await deleteDocument('promotions', p.id); showToast('Eliminado', 'success') } }} className="bg-zinc-900/80 hover:bg-red-500/80 text-red-400 hover:text-white p-2 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="gradient-gold p-6 text-center"><p className="font-display text-5xl text-zinc-900">{p.discount}%</p></div>
            <div className="p-6">
              <p className="text-white mb-3 text-lg font-medium">{p.description}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-700/50">
                <code className="font-mono font-bold px-3 py-1 rounded-lg border" style={{ color: 'var(--brand-color)', background: 'color-mix(in srgb, var(--brand-color) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--brand-color) 30%, transparent)' }}>{p.code}</code>
                <p className="text-xs text-zinc-400">Vence: {formatDate(p.validUntil)}</p>
              </div>
            </div>
          </div>
        ))}
        {promos.length === 0 && <div className="col-span-3 text-center py-16 bg-zinc-800/30 rounded-2xl border border-zinc-700/50"><p className="text-zinc-400">No has creado ninguna promoción.</p></div>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// BRANCHES
// ════════════════════════════════════════════════════════════════
export function BranchesPage() {
  const { appData, showToast, showModal, closeModal } = useApp()

  const openForm = (b = null) => {
    let name = b?.branch_name || '', loc = b?.branch_location || '', phone = b?.branch_phone || ''
    const isEdit = !!b
    showModal(
      <div className="p-6">
        <div className="flex items-center justify-between mb-6"><h2 className="font-display text-2xl text-white uppercase">{isEdit ? 'EDITAR' : 'NUEVA'} SUCURSAL</h2><button onClick={closeModal}>✕</button></div>
        <div className="space-y-4 mb-6">
          <input defaultValue={name} onChange={(e) => { name = e.target.value }} placeholder="Nombre de la Sucursal"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
          <input defaultValue={loc} onChange={(e) => { loc = e.target.value }} placeholder="Ubicación"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
          <input defaultValue={phone} onChange={(e) => { phone = e.target.value }} placeholder="Teléfono" type="tel"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
        </div>
        <button onClick={async () => {
          if (!name || !loc) return showToast('Nombre y ubicación son obligatorios', 'error')
          const data = { branch_name: name, branch_location: loc, branch_phone: phone }
          if (isEdit) { await updateDocument('branches', b.id, data) } else { await addDocument('branches', { ...data, created_at: new Date().toISOString() }) }
          closeModal(); showToast(isEdit ? 'Sucursal actualizada' : 'Sucursal creada', 'success')
        }} className="w-full gradient-gold text-zinc-900 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg">
          <Save className="w-5 h-5" /> {isEdit ? 'Guardar Cambios' : 'Guardar Sucursal'}
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div><h1 className="font-display text-3xl md:text-4xl text-white tracking-wide uppercase">SUCURSALES</h1><p className="text-zinc-400 mt-1">Administra las ubicaciones de tu barbería</p></div>
        <button onClick={() => openForm()} className="gradient-gold text-zinc-900 px-5 py-3 rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto">
          <Plus className="w-5 h-5" /> Nueva Sucursal
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="glass rounded-3xl p-6 flex flex-col border border-[color:var(--brand-color)]/50 bg-[color:var(--brand-color)]/5 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center">⭐</div>
            <h3 className="font-display text-2xl" style={{ color: 'var(--brand-color)' }}>Sede Central</h3>
          </div>
          <p className="text-zinc-300 text-sm font-medium">Administración Principal del Sistema</p>
          <p className="text-zinc-500 text-xs mt-2">Esta sucursal base no se puede eliminar.</p>
          <div className="mt-auto pt-5 border-t border-[color:var(--brand-color)]/20">
            <p className="text-xs uppercase tracking-widest text-center font-bold" style={{ color: 'var(--brand-color)' }}>Sucursal Por Defecto</p>
          </div>
        </div>
        {appData.branches.map((b) => (
          <div key={b.id} className="glass rounded-3xl p-6 flex flex-col border border-zinc-700/50 shadow-lg hover:bg-zinc-800/50 transition">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700"><Store className="w-6 h-6 text-zinc-400" /></div>
                <h3 className="font-display text-2xl text-white">{b.branch_name}</h3>
              </div>
              <p className="text-zinc-400 text-sm"><MapPin className="w-4 h-4 inline mr-1 text-zinc-500" />{b.branch_location}</p>
              {b.branch_phone && <p className="text-zinc-400 text-sm mt-2"><Phone className="w-4 h-4 inline mr-1 text-zinc-500" />{b.branch_phone}</p>}
            </div>
            <div className="flex gap-3 mt-6 pt-5 border-t border-zinc-700/50">
              <button onClick={() => openForm(b)} className="flex-1 bg-zinc-800 hover:bg-[color:var(--brand-color)] hover:text-zinc-900 text-white py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm font-bold"><Edit2 className="w-4 h-4" /> Editar</button>
              <button onClick={async () => { if (window.confirm('¿Eliminar esta sucursal?')) { await deleteDocument('branches', b.id); showToast('Sucursal eliminada', 'success') } }} className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm font-bold border border-red-500/20 hover:border-transparent"><Trash2 className="w-4 h-4" /> Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// USERS (admin)
// ════════════════════════════════════════════════════════════════
export function UsersPage() {
  const { currentUser, appData, showToast, showModal, closeModal } = useApp()

  const openEdit = (u) => {
    let name = u.name || '', phone = u.phone || ''
    showModal(
      <div className="p-6">
        <div className="flex items-center justify-between mb-6"><h2 className="font-display text-2xl text-white uppercase tracking-wide">EDITAR USUARIO</h2><button onClick={closeModal} className="p-2 text-zinc-400 hover:text-white">✕</button></div>
        <div className="space-y-4 mb-6">
          <input defaultValue={name} onChange={(e) => { name = e.target.value }} placeholder="Nombre Completo"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
          <input defaultValue={phone} onChange={(e) => { phone = e.target.value }} placeholder="Teléfono" type="tel"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
          <div className="bg-zinc-800/80 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-500 cursor-not-allowed">{u.role?.toUpperCase()}</div>
        </div>
        <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl mb-6">
          <h4 className="text-indigo-400 font-medium mb-2 flex items-center gap-2"><Key className="w-4 h-4" /> Restablecer Contraseña</h4>
          <p className="text-xs text-zinc-400 mb-3">Se enviará un enlace seguro a <b>{u.email}</b></p>
          <button onClick={async () => {
            try { await sendPasswordResetEmail(auth, u.email); showToast('¡Enlace enviado!', 'success') }
            catch { showToast('Error al enviar correo', 'error') }
          }} className="w-full bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 border border-indigo-500/30">
            <Mail className="w-4 h-4" /> Enviar Enlace
          </button>
        </div>
        <button onClick={async () => {
          if (!name) return showToast('El nombre es obligatorio', 'error')
          await updateDocument('users', u.id, { name, phone })
          closeModal(); showToast('Usuario actualizado', 'success')
        }} className="w-full gradient-gold text-zinc-900 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg">
          <Save className="w-5 h-5" /> Guardar Cambios
        </button>
      </div>
    )
  }

  const deleteUser = async (id) => {
    if (currentUser.id === id) return window.alert('⚠️ No puedes eliminar tu propia cuenta.')
    if (!window.confirm('¿Eliminar este usuario? Perderá el acceso permanentemente.')) return
    try { await deleteDocument('users', id); showToast('Usuario eliminado', 'success') }
    catch { showToast('Error al eliminar', 'error') }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in">
      <div className="mb-6 md:mb-8"><h1 className="font-display text-3xl md:text-4xl text-white tracking-wide uppercase">USUARIOS</h1><p className="text-zinc-400">Gestión de cuentas de acceso</p></div>
      <div>
        {appData.users.map((u) => {
          const isMe = currentUser?.id === u.id
          return (
            <div key={u.id} className="bg-zinc-800/80 p-5 md:p-6 mb-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between border border-zinc-700/50 shadow-lg">
              <div className="mb-4 md:mb-0">
                <h3 className="text-white font-display text-xl md:text-2xl flex items-center gap-3 mb-2">
                  {u.name}
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md" style={{ color: 'var(--brand-color)', background: 'color-mix(in srgb, var(--brand-color) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--brand-color) 20%, transparent)' }}>{u.role}</span>
                </h3>
                <p className="text-zinc-400 text-sm flex flex-wrap items-center gap-y-2">
                  <span><Mail className="w-4 h-4 inline mr-1 text-zinc-500" />{u.email}</span>
                  {u.phone && <span className="ml-4"><Phone className="w-4 h-4 inline mr-1 text-zinc-500" />{u.phone}</span>}
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0 pt-4 border-t border-zinc-700/50 md:border-0 md:pt-0">
                <button onClick={() => openEdit(u)} className="flex-1 md:w-auto bg-zinc-800 hover:bg-[color:var(--brand-color)] hover:text-zinc-900 text-white py-3 px-4 rounded-xl transition flex justify-center items-center gap-2 text-sm font-bold shadow-sm">
                  <Edit2 className="w-4 h-4" /> Editar {isMe && '(Tú)'}
                </button>
                {!isMe && (
                  <button onClick={() => deleteUser(u.id)} className="flex-1 md:w-auto bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white py-3 px-4 rounded-xl transition flex justify-center items-center gap-2 text-sm font-bold shadow-sm border border-red-500/20 hover:border-transparent">
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {appData.users.length === 0 && <div className="text-center py-16 bg-zinc-800/30 rounded-3xl border border-zinc-700/50"><p className="text-zinc-300 text-xl">No hay usuarios registrados</p></div>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// BRANDING
// ════════════════════════════════════════════════════════════════
export function BrandingPage() {
  const { branding, setBranding, showToast } = useApp()
  const [shopName, setShopName] = useState(branding?.shopName || 'BARBERPRO')
  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor || '#FBBF24')
  const [logoBase64, setLogoBase64] = useState(branding?.logoUrl || '')
  const [photoStyle, setPhotoStyle] = useState(branding?.photoStyle || 'normal')
  const [saving, setSaving] = useState(false)

  const handleLogo = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { const compressed = await compressImage(file); setLogoBase64(compressed); showToast('Imagen optimizada y lista', 'success') }
    catch { showToast('Error al procesar imagen', 'error') }
  }

  const save = async () => {
    setSaving(true)
    try {
      const newConfig = { shopName, primaryColor, logoUrl: logoBase64, photoStyle, updated_at: new Date().toISOString() }
      localStorage.setItem('barber_branding', JSON.stringify(newConfig))
      await saveBranding(newConfig)
      setBranding(newConfig)
      showToast('¡Configuración guardada! Recargando...', 'success')
      setTimeout(() => window.location.reload(), 1000)
    } catch { showToast('Error al guardar', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-white uppercase tracking-wide">MARCA BLANCA</h1>
        <p className="text-zinc-400">Personaliza la identidad visual del sistema</p>
      </div>
      <div className="glass rounded-3xl p-6 lg:p-8 border border-zinc-700/50 shadow-2xl max-w-2xl">
        <h2 className="font-display text-xl mb-6 flex items-center gap-2" style={{ color: 'var(--brand-color)' }}>
          <Palette className="w-5 h-5" /> Identidad de la Marca
        </h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-2 font-bold uppercase tracking-wider">Nombre del Negocio</label>
            <input value={shopName} onChange={(e) => setShopName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2 font-bold uppercase tracking-wider">Color Principal</label>
            <div className="flex items-center gap-4">
              <input type="color" value={primaryColor}
                onChange={(e) => { setPrimaryColor(e.target.value); document.documentElement.style.setProperty('--brand-color', e.target.value) }}
                className="w-16 h-16 rounded-xl cursor-pointer bg-zinc-800 border border-zinc-700 shadow-lg" />
              <div>
                <p className="text-white font-mono font-bold">{primaryColor}</p>
                <p className="text-xs text-zinc-500 mt-1">Mueve el selector para ver cambios en tiempo real.</p>
              </div>
            </div>
          </div>
          <div className="border-t border-zinc-700/50 pt-4">
            <label className="block text-sm text-zinc-400 mb-2 font-bold uppercase tracking-wider">Logotipo (Imagen)</label>
            <input type="file" accept="image/png,image/jpeg" onChange={handleLogo} className="text-white text-sm" />
            {logoBase64 && <img src={logoBase64} alt="logo preview" className="mt-3 w-20 h-20 object-cover rounded-xl border border-zinc-700" />}
          </div>
          <div className="pt-4 border-t border-zinc-700/50">
            <label className="block text-sm text-zinc-400 mb-2 font-bold uppercase tracking-wider">Filtro de Fotos</label>
            <select value={photoStyle} onChange={(e) => setPhotoStyle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none appearance-none">
              <option value="normal">Sin filtro</option>
              <option value="polaroid">Efecto Polaroid</option>
              <option value="bw">Blanco y Negro</option>
            </select>
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="w-full mt-8 bg-white hover:bg-gray-200 text-black py-4 rounded-xl font-bold transition shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
          <Save className="w-5 h-5" /> {saving ? 'Guardando...' : 'APLICAR Y REINICIAR'}
        </button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// HISTORY (client)
// ════════════════════════════════════════════════════════════════
export function HistoryPage() {
  const { currentUser, appData } = useApp()
  const past = appData.appointments
    .filter((a) => a.client_id === currentUser.id && (new Date(a.date) < new Date() || a.status === 'completed' || a.status === 'cancelled'))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8"><h1 className="font-display text-3xl text-white mb-2">HISTORIAL</h1><p className="text-zinc-400">Tu historial de citas</p></div>
      <div className="glass rounded-2xl p-6">
        {past.length > 0 ? (
          <div className="space-y-3">
            {past.map((apt) => {
              const svc = appData.services.find((s) => s.id === apt.service_name) || { name: apt.service_name }
              return (
                <div key={apt.id} className={`bg-zinc-700/30 rounded-xl p-4 flex items-center justify-between ${apt.status === 'cancelled' ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${apt.status === 'completed' ? 'bg-green-500/20' : 'bg-zinc-600'} rounded-lg flex items-center justify-center`}>
                      {apt.status === 'completed' ? '✓' : '✗'}
                    </div>
                    <div>
                      <p className="font-medium text-white">{svc.name}</p>
                      <p className="text-sm text-zinc-400">{formatDate(apt.date)} - {apt.time}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>{getStatusLabel(apt.status)}</span>
                </div>
              )
            })}
          </div>
        ) : <div className="text-center py-12"><p className="text-zinc-400">Sin historial</p></div>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// CLIENTS (barber)
// ════════════════════════════════════════════════════════════════
export function ClientsPage() {
  const { appData } = useApp()
  const clients = appData.users.filter((u) => u.role === 'client')
  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8"><h1 className="font-display text-3xl text-white">CLIENTES</h1></div>
      <div className="glass rounded-2xl p-6 space-y-3">
        {clients.map((c) => (
          <div key={c.id} className="bg-zinc-700/30 p-4 rounded-xl flex justify-between">
            <div><p className="text-white">{c.name}</p><p className="text-zinc-400 text-sm">{c.email}</p></div>
            <p style={{ color: 'var(--brand-color)' }}>{c.phone}</p>
          </div>
        ))}
        {clients.length === 0 && <p className="text-center text-zinc-500 py-8">No hay clientes registrados.</p>}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// PRODUCT SALES HISTORY
// ════════════════════════════════════════════════════════════════
export function ProductSalesPage() {
  const { appData, showToast, showModal, closeModal } = useApp()
  const sales = [...(appData.product_sales || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const deleteSale = async (id) => {
    const sale = sales.find((s) => s.id === id)
    if (!sale) return
    if (!window.confirm('¿Anular esta venta? El stock se restaurará automáticamente.')) return
    try {
      if (sale.items) {
        for (const item of sale.items) {
          const prod = appData.products.find((p) => p.id === item.id)
          if (prod) await updateDocument('products', item.id, { stock: prod.stock + item.qty })
        }
      }
      await deleteDocument('product_sales', id)
      showToast('Venta anulada y stock restaurado', 'success')
    } catch { showToast('Error al anular', 'error') }
  }

  const viewTicket = (s) => {
    const html = `<div style="font-family:monospace;padding:20px;background:white;color:black;border-radius:8px;max-width:300px;margin:0 auto;">
      <h2 style="text-align:center;margin:0 0 10px;font-size:20px;">${JSON.parse(localStorage.getItem('barber_branding') || '{}').shopName || 'BARBERPRO'}</h2>
      <p style="text-align:center;font-size:11px;margin:0 0 15px;">TICKET DE COMPRA</p>
      <p style="font-size:12px;">Folio: #${s.id.substring(0,6).toUpperCase()}</p>
      <p style="font-size:12px;margin-bottom:10px;">Fecha: ${formatDate(s.date)} ${formatTime12h(s.time)}</p>
      ${(s.items||[]).map((i) => `<div style="display:flex;justify-content:space-between;font-size:12px;""><span>${i.qty}x ${i.name}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`).join('')}
      <div style="border-top:1px dashed #000;margin:10px 0;padding-top:10px;display:flex;justify-content:space-between;font-weight:bold;"><span>TOTAL:</span><span>$${Number(s.total).toFixed(2)}</span></div>
      <p style="text-align:center;font-size:11px;">¡Gracias por tu preferencia!</p>
    </div>`
    showModal(
      <div className="p-6">
        <div className="flex justify-between mb-4"><h2 className="font-display text-2xl text-white">Ticket</h2><button onClick={closeModal}>✕</button></div>
        <div dangerouslySetInnerHTML={{ __html: html }} className="mb-4" />
        <div className="flex gap-3">
          <button onClick={closeModal} className="flex-1 bg-zinc-800 text-white py-3 rounded-xl font-bold">Cerrar</button>
          <button onClick={() => { const w = window.open('','_blank'); w.document.body.innerHTML = html; setTimeout(() => { w.print(); w.close() }, 500) }}
            className="flex-1 gradient-gold text-zinc-900 py-3 rounded-xl font-bold flex justify-center items-center gap-2">
            🖨️ Imprimir
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in flex flex-col h-full">
      <div className="mb-6 md:mb-8 shrink-0">
        <h1 className="font-display text-3xl md:text-4xl text-white uppercase tracking-wide">HISTORIAL DEL PUNTO DE VENTA</h1>
        <p className="text-zinc-400 text-sm mt-1">Registro de ventas de productos. Anular restaura el stock automáticamente.</p>
      </div>
      <div className="glass rounded-3xl border border-zinc-700/50 shadow-2xl overflow-hidden flex-1 min-h-0">
        <div className="overflow-y-auto h-full custom-scrollbar">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-zinc-800/90 text-[color:var(--brand-color)] text-xs uppercase tracking-widest sticky top-0">
              <tr>{['Fecha y Hora','Artículos Vendidos','Total Cobrado','Acción'].map((h) => <th key={h} className="px-6 py-5">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/30">
              {sales.length > 0 ? sales.map((s) => (
                <tr key={s.id} className="text-white hover:bg-zinc-800/50 transition">
                  <td className="py-4 px-6">
                    <p className="font-medium">{formatDate(s.date)}</p>
                    <p className="text-xs font-bold tracking-widest mt-1" style={{ color: 'var(--brand-color)' }}>{formatTime12h(s.time)}</p>
                  </td>
                  <td className="py-4 px-6 max-w-xs">
                    {(s.items || []).map((i, idx) => (
                      <span key={idx} className="bg-zinc-700/50 px-2 py-1 rounded text-xs text-zinc-300 mr-1 mb-1 inline-block">{i.qty}x {i.name}</span>
                    ))}
                  </td>
                  <td className="py-4 px-6 font-display text-2xl text-green-400">${Number(s.total).toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button onClick={() => viewTicket(s)} className="text-zinc-500 hover:text-[color:var(--brand-color)] bg-zinc-900 p-2.5 rounded-lg border border-zinc-700 hover:border-[color:var(--brand-color)]/30 transition"><Receipt className="w-4 h-4" /></button>
                      <button onClick={() => deleteSale(s.id)} className="text-zinc-500 hover:text-red-400 bg-zinc-900 p-2.5 rounded-lg border border-zinc-700 hover:border-red-500/30 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={4} className="text-center py-16 text-zinc-500">No hay ventas de productos registradas</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════════════════════════
export function StatsPage() {
  const { appData } = useApp()
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const [period, setPeriod] = useState('week')

  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const completed = appData.appointments.filter((a) => a.status === 'completed')
  const productSales = appData.product_sales || []
  const expenses = appData.expenses || []

  const getPrice = (apt) => {
    const s = appData.services.find((sv) => sv.id === apt.service_name)
    return s ? Number(s.price) : 0
  }
  const getCommission = (apt) => {
    const b = appData.barbers.find((br) => br.id === apt.barber_id)
    const comm = b ? b.commission || 50 : 50
    return (getPrice(apt) * comm) / 100
  }

  const monthlyApts = completed.filter((a) => { const d = new Date(a.date+'T00:00:00'); return d.getMonth()===currentMonth && d.getFullYear()===currentYear })
  const monthlyProductTotal = productSales.filter((s) => { const d = new Date(s.date+'T00:00:00'); return d.getMonth()===currentMonth && d.getFullYear()===currentYear }).reduce((sum, s) => sum + Number(s.total||0), 0)
  const monthlySales = monthlyApts.reduce((s, a) => s + getPrice(a), 0) + monthlyProductTotal
  const monthlyPayroll = monthlyApts.reduce((s, a) => s + getCommission(a), 0)
  const monthlyExpenses = expenses.filter((e) => { const d = new Date(e.date+'T00:00:00'); return d.getMonth()===currentMonth && d.getFullYear()===currentYear }).reduce((s, e) => s + Number(e.amount), 0)
  const netProfit = monthlySales - monthlyPayroll - monthlyExpenses

  useEffect(() => {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()

    const branding = JSON.parse(localStorage.getItem('barber_branding') || '{}')
    const chartColor = branding.primaryColor || '#D4AF37'
    const hexToRgba = (hex, alpha) => {
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
      return `rgba(${r},${g},${b},${alpha})`
    }

    let labels = [], dataIngresos = [], dataNominas = [], dataGastos = []

    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(today.getDate() - i)
        const ds = formatDateForInput(d)
        labels.push(d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }))
        const dayApts = completed.filter((a) => a.date === ds)
        const dayPS = productSales.filter((s) => s.date === ds).reduce((sum, s) => sum + Number(s.total||0), 0)
        dataIngresos.push(dayApts.reduce((s, a) => s + getPrice(a), 0) + dayPS)
        dataNominas.push(dayApts.reduce((s, a) => s + getCommission(a), 0))
        dataGastos.push(expenses.filter((e) => e.date === ds).reduce((s, e) => s + Number(e.amount), 0))
      }
    } else if (period === 'month') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(today.getDate() - i)
        const ds = formatDateForInput(d)
        labels.push(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))
        const dayApts = completed.filter((a) => a.date === ds)
        const dayPS = productSales.filter((s) => s.date === ds).reduce((sum, s) => sum + Number(s.total||0), 0)
        dataIngresos.push(dayApts.reduce((s, a) => s + getPrice(a), 0) + dayPS)
        dataNominas.push(dayApts.reduce((s, a) => s + getCommission(a), 0))
        dataGastos.push(expenses.filter((e) => e.date === ds).reduce((s, e) => s + Number(e.amount), 0))
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const tm = d.getMonth(), ty = d.getFullYear()
        labels.push(d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }).replace('.',''))
        const mApts = completed.filter((a) => { const ad = new Date(a.date+'T00:00:00'); return ad.getMonth()===tm && ad.getFullYear()===ty })
        const mPS = productSales.filter((s) => { const sd = new Date(s.date+'T00:00:00'); return sd.getMonth()===tm && sd.getFullYear()===ty }).reduce((sum, s) => sum + Number(s.total||0), 0)
        dataIngresos.push(mApts.reduce((s, a) => s + getPrice(a), 0) + mPS)
        dataNominas.push(mApts.reduce((s, a) => s + getCommission(a), 0))
        dataGastos.push(expenses.filter((e) => { const ed = new Date(e.date+'T00:00:00'); return ed.getMonth()===tm && ed.getFullYear()===ty }).reduce((s, e) => s + Number(e.amount), 0))
      }
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Ingreso Bruto ($)', data: dataIngresos, backgroundColor: hexToRgba(chartColor, 0.15), borderColor: chartColor, borderWidth: 3, pointBackgroundColor: '#18181b', pointBorderColor: chartColor, pointBorderWidth: 2, pointRadius: period==='month'?1:4, fill: true, tension: 0.4 },
          { label: 'Nóminas ($)', data: dataNominas, backgroundColor: 'transparent', borderColor: '#EF4444', borderWidth: 2, borderDash: [5,5], pointRadius: period==='month'?1:3, fill: false, tension: 0.4 },
          { label: 'Gastos Operativos ($)', data: dataGastos, backgroundColor: 'transparent', borderColor: '#F97316', borderWidth: 2, pointRadius: period==='month'?1:3, fill: false, tension: 0.4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, labels: { color: '#a1a1aa', usePointStyle: true, boxWidth: 8 } }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#a1a1aa' } },
          x: { grid: { display: false }, ticks: { color: '#a1a1aa', maxTicksLimit: period==='month'?10:12 } },
        },
      },
    })
  }, [period, appData])

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-wide uppercase text-white">REPORTE FINANCIERO</h1>
        <p className="text-zinc-400">Resumen de utilidades del mes actual ({today.toLocaleString('es-ES', { month: 'long', year: 'numeric' })})</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Ingreso Bruto', value: `$${monthlySales.toFixed(2)}`, cls: 'bg-zinc-800/80 border-zinc-700', vCls: 'text-white' },
          { label: 'Nóminas', value: `-$${monthlyPayroll.toFixed(2)}`, cls: 'bg-red-500/5 border-red-500/20', vCls: 'text-red-400' },
          { label: 'Gastos', value: `-$${monthlyExpenses.toFixed(2)}`, cls: 'bg-red-500/5 border-red-500/20', vCls: 'text-red-400' },
          { label: 'Utilidad Neta', value: `$${netProfit.toFixed(2)}`, cls: 'bg-green-500/10 border-green-500/30', vCls: 'text-green-400' },
        ].map(({ label, value, cls, vCls }) => (
          <div key={label} className={`${cls} border rounded-2xl p-6 relative overflow-hidden`}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-zinc-400">{label}</p>
            <p className={`font-display text-3xl ${vCls}`}>{value}</p>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-6 border border-zinc-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-white font-medium">Comparativa de Ingresos vs Gastos</h3>
          <div className="flex bg-zinc-800/80 p-1 rounded-lg border border-zinc-700/50">
            {['week','month','year'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${period===p ? 'text-zinc-900' : 'text-zinc-400 hover:text-white'}`}
                style={period===p ? { background: 'var(--brand-color)' } : {}}>
                {p==='week'?'7 Días':p==='month'?'30 Días':'12 Meses'}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full h-72 relative"><canvas ref={chartRef}></canvas></div>
      </div>
    </div>
  )
}
