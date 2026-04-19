// src/pages/Dashboard.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarPlus, Scissors, CalendarCheck, Percent, Banknote,
  Clock, CheckCircle, CheckCheck, Coffee, CalendarX, Wallet,
  CalendarRange, PaintBucket, Landmark, Receipt, Users, TrendingUp,
  ChevronRight, Calendar,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getTodayStr, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers'

// ─── CLIENT ───────────────────────────────────────────────────────────────────
function ClientDashboard() {
  const { currentUser, appData } = useApp()
  const navigate = useNavigate()
  const myApts = appData.appointments.filter(
    (a) => a.client_id === currentUser.id && a.status !== 'cancelled'
  )
  const upcoming = myApts.filter((a) => new Date(a.date) >= new Date()).slice(0, 3)

  const quickLinks = [
    { to: '/book', label: 'Reservar Cita', Icon: CalendarPlus, gold: true },
    { to: '/services', label: 'Ver Servicios', Icon: Scissors, gold: false },
    { to: '/my-appointments', label: 'Mis Citas', Icon: CalendarCheck, gold: false },
    { to: '/promotions', label: 'Ofertas', Icon: Percent, gold: false },
  ]

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-white mb-2">
          ¡Hola, {currentUser.name?.split(' ')[0]}!
        </h1>
        <p className="text-zinc-400">¿Listo para tu próximo corte?</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickLinks.map(({ to, label, Icon, gold }) => (
          <button key={to} onClick={() => navigate(to)}
            className="glass rounded-xl p-6 text-center hover:bg-[color:var(--brand-color)]/10 transition group">
            <div className={`w-12 h-12 ${gold ? 'gradient-gold' : 'bg-zinc-700'} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition`}>
              <Icon className={`w-6 h-6 ${gold ? 'text-zinc-900' : ''}`} style={!gold ? { color: 'var(--brand-color)' } : {}} />
            </div>
            <p className="font-medium text-white">{label}</p>
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-white">PRÓXIMAS CITAS</h2>
          <button onClick={() => navigate('/my-appointments')} className="text-sm hover:underline" style={{ color: 'var(--brand-color)' }}>Ver todas</button>
        </div>
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map((apt) => {
              const svc = appData.services.find((s) => s.id === apt.service_name) || { name: apt.service_name, price: 0 }
              const barber = appData.barbers.find((b) => b.id === apt.barber_id) || { name: 'Barbero' }
              return (
                <div key={apt.id} className="bg-zinc-700/30 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 gradient-gold rounded-xl flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-zinc-900" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{svc.name}</p>
                      <p className="text-sm text-zinc-400">con {barber.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium" style={{ color: 'var(--brand-color)' }}>{formatDate(apt.date)}</p>
                    <p className="text-sm text-zinc-400">{apt.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarX className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 mb-4">No tienes citas programadas</p>
            <button onClick={() => navigate('/book')} className="gradient-gold text-zinc-900 px-6 py-2 rounded-lg font-medium hover:opacity-90 transition">
              Reservar Ahora
            </button>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-xl text-white mb-4">SERVICIOS DESTACADOS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appData.services.slice(0, 3).map((svc) => (
            <div key={svc.id} className="bg-zinc-700/30 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--brand-color) 20%, transparent)' }}>
                  <Scissors className="w-5 h-5" style={{ color: 'var(--brand-color)' }} />
                </div>
                <span className="font-display text-2xl" style={{ color: 'var(--brand-color)' }}>${svc.price}</span>
              </div>
              <h3 className="font-medium text-white mb-1">{svc.name}</h3>
              <p className="text-sm text-zinc-400 mb-3">{svc.description}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Clock className="w-4 h-4" /><span>{svc.duration} min</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── BARBER ───────────────────────────────────────────────────────────────────
function BarberDashboard() {
  const { currentUser, appData } = useApp()
  const navigate = useNavigate()
  const today = getTodayStr()

  const todayApts = appData.appointments.filter(
    (a) => a.date === today &&
      (a.barber_id === currentUser.barber_id || a.barber_id === currentUser.id) &&
      a.status !== 'cancelled'
  )

  const pending   = todayApts.filter((a) => a.status === 'pending').length
  const confirmed = todayApts.filter((a) => a.status === 'confirmed').length
  const completed = todayApts.filter((a) => a.status === 'completed')

  const todayEarnings = completed.reduce((sum, apt) => {
    const svc = appData.services.find((s) => s.id === apt.service_name)
    return sum + (svc ? Number(svc.price) : 0)
  }, 0)

  const stats = [
    { label: 'Ingresos Hoy', value: `${todayEarnings}$`, Icon: Banknote, gold: true },
    { label: 'Pendientes', value: pending, Icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { label: 'Confirmadas', value: confirmed, Icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    { label: 'Completadas', value: completed.length, Icon: CheckCheck, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  ]

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-white mb-2">
          ¡Buen día, {currentUser.name?.split(' ')[0]}!
        </h1>
        <p className="text-zinc-400">{formatDate(today)} — {todayApts.length} citas en total hoy</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, Icon, gold, color, bg }) => (
          <div key={label} className={`glass rounded-xl p-5 ${gold ? 'border border-[color:var(--brand-color)]/30 bg-[color:var(--brand-color)]/5' : ''}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${gold ? 'gradient-gold' : bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${gold ? 'text-zinc-900' : color}`} />
              </div>
              <span className={`text-sm ${gold ? '' : 'text-zinc-400'}`} style={gold ? { color: 'var(--brand-color)' } : {}}>{label}</span>
            </div>
            <p className={`font-display text-3xl ${gold ? '' : 'text-white'}`} style={gold ? { color: 'var(--brand-color)' } : {}}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/today', label: 'Ver Hoy', Icon: Calendar },
          { to: '/walk-in', label: 'Venta Directa', Icon: Banknote },
          { to: '/calendar', label: 'Calendario', Icon: Calendar },
          { to: '/clients', label: 'Clientes', Icon: Users },
        ].map(({ to, label, Icon }) => (
          <button key={to} onClick={() => navigate(to)}
            className="glass rounded-xl p-4 text-center hover:bg-[color:var(--brand-color)]/10 transition">
            <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--brand-color)' }} />
            <p className="text-sm text-white">{label}</p>
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-white">CITAS DE HOY</h2>
          <button onClick={() => navigate('/today')} className="text-sm hover:underline" style={{ color: 'var(--brand-color)' }}>Ver detalle</button>
        </div>
        {todayApts.length > 0 ? (
          <div className="space-y-3">
            {todayApts.slice(0, 5).map((apt) => {
              const svc = appData.services.find((s) => s.id === apt.service_name) || { name: apt.service_name }
              const isWalkIn = apt.client_id === 'walk-in'
              return (
                <div key={apt.id} className="bg-zinc-700/30 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="font-display text-xl" style={{ color: 'var(--brand-color)' }}>{apt.time}</p>
                    </div>
                    <div className="w-px h-10 bg-zinc-600" />
                    <div>
                      <p className="font-medium text-white flex items-center gap-1">
                        {apt.notes || 'Cliente'}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ml-1 ${isWalkIn ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {isWalkIn ? 'Directo' : 'Cita'}
                        </span>
                      </p>
                      <p className="text-sm text-zinc-400">{svc.name}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Coffee className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No hay citas programadas para hoy</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const { currentUser, appData } = useApp()
  const navigate = useNavigate()
  const today = getTodayStr()

  const completed = appData.appointments.filter((a) => a.status === 'completed')
  const todayApts = appData.appointments.filter((a) => a.date === today && a.status !== 'cancelled')
  const pending = todayApts.filter((a) => a.status === 'pending').sort((a, b) => a.time.localeCompare(b.time))

  // Financial
  let totalBruto = 0, totalNominas = 0, totalGastos = 0
  completed.forEach((apt) => {
    const svc = appData.services.find((s) => s.id === apt.service_name)
    if (svc) {
      const price = Number(svc.price)
      totalBruto += price
      const barber = appData.barbers.find((b) => b.id === apt.barber_id)
      totalNominas += (price * (barber?.commission || 50)) / 100
    }
  })
  ;(appData.expenses || []).forEach((e) => { totalGastos += Number(e.amount) })
  ;(appData.product_sales || []).forEach((s) => { totalBruto += Number(s.total || 0) })
  const gananciaNeta = totalBruto - totalNominas - totalGastos

  // Popular services
  const svcCounts = {}
  completed.forEach((a) => { svcCounts[a.service_name] = (svcCounts[a.service_name] || 0) + 1 })
  const popular = Object.entries(svcCounts).map(([id, count]) => {
    const s = appData.services.find((sv) => sv.id === id)
    return { name: s?.name || 'Eliminado', count, price: s?.price || 0 }
  }).sort((a, b) => b.count - a.count).slice(0, 4)

  return (
    <div className="p-6 lg:p-8 fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl lg:text-4xl text-white mb-2 uppercase tracking-wide">Panel de Administración</h1>
        <p className="text-zinc-400">Resumen histórico y financiero de tu negocio</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Ingreso Bruto Global', value: `$${totalBruto.toFixed(2)}`, Icon: Wallet, color: 'text-blue-400', bg: 'bg-blue-500/20', border: '' },
          { label: 'Nómina Generada', value: `-$${totalNominas.toFixed(2)}`, Icon: Users, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border border-red-500/20 bg-red-500/5' },
          { label: 'Gastos', value: `-$${totalGastos.toFixed(2)}`, Icon: Receipt, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border border-orange-500/20 bg-orange-500/5' },
          { label: 'Ganancia Neta', value: `$${gananciaNeta.toFixed(2)}`, Icon: Landmark, color: 'text-zinc-900', bg: 'gradient-gold', border: 'border border-[color:var(--brand-color)]/30 bg-[color:var(--brand-color)]/10', gold: true },
          { label: 'Citas para Hoy', value: todayApts.length, Icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/20', border: '' },
        ].map(({ label, value, Icon, color, bg, border, gold }) => (
          <div key={label} className={`glass rounded-xl p-5 ${border}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold ${gold ? '' : 'text-zinc-400'}`} style={gold ? { color: 'var(--brand-color)' } : {}}>{label}</span>
            </div>
            <p className={`font-display text-3xl ${gold ? '' : color === 'text-zinc-900' ? 'text-white' : color}`} style={gold ? { color: 'var(--brand-color)' } : {}}>{value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/daily-sales', label: 'Ventas de Hoy', Icon: Banknote },
          { to: '/payroll', label: 'Pagar Nóminas', Icon: Wallet },
          { to: '/appointments', label: 'Todas las Citas', Icon: CalendarRange },
          { to: '/branding', label: 'Personalización', Icon: PaintBucket },
        ].map(({ to, label, Icon }) => (
          <button key={to} onClick={() => navigate(to)}
            className="glass rounded-xl p-4 text-center hover:bg-zinc-800 transition border border-transparent hover:border-[color:var(--brand-color)]/30">
            <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--brand-color)' }} />
            <p className="text-sm text-white">{label}</p>
          </button>
        ))}
      </div>

      {/* Bottom grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-zinc-700/50">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl text-white flex items-center gap-2">
              <Clock className="w-5 h-5" style={{ color: 'var(--brand-color)' }} /> En Espera (Hoy)
            </h2>
            <span className="text-zinc-900 text-xs font-bold px-2 py-1 rounded-md" style={{ background: 'var(--brand-color)' }}>{pending.length}</span>
          </div>
          {pending.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
              {pending.map((apt) => {
                const svc = appData.services.find((s) => s.id === apt.service_name)
                const barber = appData.barbers.find((b) => b.id === apt.barber_id)
                const client = apt.client_id === 'walk-in' ? apt.notes || 'Cliente Directo' : apt.client_name || 'Cliente App'
                return (
                  <div key={apt.id} className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/50 flex justify-between items-center hover:border-[color:var(--brand-color)]/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-900 text-zinc-400 font-bold p-2 rounded-lg text-xs w-14 text-center border border-zinc-700" style={{ color: 'var(--brand-color)' }}>{apt.time}</div>
                      <div>
                        <p className="text-white font-medium text-sm">{client}</p>
                        <p className="text-zinc-400 text-xs">{svc?.name} • {barber?.name}</p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/appointments')} className="text-zinc-500 hover:text-[color:var(--brand-color)] p-2">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-green-500/50 mx-auto mb-2" />
              <p className="text-zinc-500 text-sm">No hay citas pendientes para hoy.</p>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 border border-zinc-700/50">
          <h2 className="font-display text-xl text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--brand-color)' }} /> Top Servicios
          </h2>
          {popular.length > 0 ? (
            <div className="space-y-3">
              {popular.map((srv, i) => (
                <div key={srv.name} className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-xs font-bold text-zinc-400">#{i + 1}</div>
                    <div>
                      <p className="text-white text-sm font-medium">{srv.name}</p>
                      <p className="text-xs font-bold" style={{ color: 'var(--brand-color)' }}>${srv.price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{srv.count}</p>
                    <p className="text-zinc-500 text-[10px] uppercase">Ventas</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-zinc-500 py-4 text-sm">Aún no hay datos suficientes.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { currentUser } = useApp()
  if (!currentUser) return null
  if (currentUser.role === 'client') return <ClientDashboard />
  if (currentUser.role === 'barber') return <BarberDashboard />
  return <AdminDashboard />
}
