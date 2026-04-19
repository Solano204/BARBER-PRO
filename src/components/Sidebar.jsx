// src/components/Sidebar.jsx
import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Scissors, LayoutDashboard, CalendarCheck, CalendarPlus, History,
  Percent, CalendarDays, Banknote, ShoppingBag, Calendar, Clock,
  Users, BadgeDollarSign, ClipboardList, Wallet, Palette, Receipt,
  CalendarRange, UserCog, BarChart3, Store, LogOut, Menu, X, User,
  ChevronRight,
} from 'lucide-react'
import { logoutUser } from '../firebase/auth'
import { useApp } from '../context/AppContext'
import { getRoleLabel } from '../utils/helpers'

const NAV_ITEMS = {
  client: [
    { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/services', label: 'Servicios', Icon: Scissors },
    { to: '/book', label: 'Reservar Cita', Icon: CalendarPlus },
    { to: '/my-appointments', label: 'Mis Citas', Icon: CalendarCheck },
    { to: '/history', label: 'Historial', Icon: History },
    { to: '/promotions', label: 'Promociones', Icon: Percent },
  ],
  barber: [
    { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/today', label: 'Citas de Hoy', Icon: CalendarDays },
    { to: '/walk-in', label: 'Venta Directa', Icon: Banknote },
    { to: '/pos', label: 'Punto de Venta', Icon: ShoppingBag },
    { to: '/calendar', label: 'Calendario', Icon: Calendar },
    { to: '/schedule', label: 'Mi Horario', Icon: Clock },
    { to: '/clients', label: 'Clientes', Icon: Users },
  ],
  admin: [
    { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/daily-sales', label: 'Ventas de Hoy', Icon: BadgeDollarSign },
    { to: '/pos', label: 'Punto de Venta', Icon: ShoppingBag },
    { to: '/product-sales', label: 'Historial POS', Icon: ClipboardList },
    { to: '/payroll', label: 'Nóminas', Icon: Wallet },
    { to: '/branding', label: 'Personalización', Icon: Palette },
    { to: '/expenses', label: 'Gastos', Icon: Receipt },
    { to: '/appointments', label: 'Todas las Citas', Icon: CalendarRange },
    { to: '/calendar', label: 'Calendario', Icon: Calendar },
    { to: '/barbers', label: 'Barberos', Icon: Users },
    { to: '/services-admin', label: 'Servicios', Icon: Scissors },
    { to: '/promotions-admin', label: 'Promociones', Icon: Percent },
    { to: '/users', label: 'Usuarios', Icon: UserCog },
    { to: '/stats', label: 'Estadísticas', Icon: BarChart3 },
    { to: '/branches', label: 'Sucursales', Icon: Store },
  ],
}

function NavItem({ to, label, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left ${
          isActive
            ? 'bg-[color:var(--brand-color)]/20 text-[color:var(--brand-color)]'
            : 'text-zinc-400 hover:bg-zinc-700/50 hover:text-white'
        }`
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { currentUser, branding } = useApp()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = currentUser?.role || 'client'
  let items = NAV_ITEMS[role] || NAV_ITEMS.client

  // Hide branches for branch admins
  if (role === 'admin' && currentUser?.branch_id && currentUser.branch_id !== 'main') {
    items = items.filter((i) => i.to !== '/branches')
  }

  const handleLogout = async () => {
    await logoutUser()
    navigate('/login')
  }

  const BrandLogo = () => (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 gradient-gold rounded-lg flex items-center justify-center flex-shrink-0">
        {branding?.logoUrl
          ? <img src={branding.logoUrl} className="w-full h-full object-cover rounded-lg" alt="logo" />
          : <Scissors className="w-5 h-5 text-zinc-900" />
        }
      </div>
      <span className="font-display text-2xl" style={{ color: 'var(--brand-color)' }}>
        {branding?.shopName || 'BARBERPRO'}
      </span>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 bg-zinc-800/50 border-r border-zinc-700/50 flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-6 border-b border-zinc-700/50">
          <BrandLogo />
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {items.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>
        <div className="p-4 border-t border-zinc-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{currentUser?.name}</p>
              <p className="text-xs text-zinc-400">{getRoleLabel(role)}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-zinc-400 hover:text-red-400 transition py-2 px-3 rounded-lg hover:bg-zinc-700/50"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-zinc-800/95 backdrop-blur border-b border-zinc-700/50 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-gold rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-zinc-900" />
            </div>
            <span className="font-display text-xl" style={{ color: 'var(--brand-color)' }}>
              {branding?.shopName || 'BARBERPRO'}
            </span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 text-zinc-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-zinc-900/95 backdrop-blur z-50 lg:hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-zinc-700/50">
            <span className="font-display text-xl" style={{ color: 'var(--brand-color)' }}>MENÚ</span>
            <button onClick={() => setMobileOpen(false)} className="p-2 text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-auto">
            {items.map((item) => (
              <NavItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
            ))}
          </nav>
          <div className="p-4 border-t border-zinc-700/50">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-red-400 py-3">
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
