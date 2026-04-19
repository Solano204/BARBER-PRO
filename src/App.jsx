// src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { ToastContainer } from './components/Toast'
import { Modal } from './components/Modal'
import { Sidebar } from './components/Sidebar'

// Pages
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import BookingPage from './pages/BookingPage'
import { TodayPage, AllAppointmentsPage, MyAppointmentsPage } from './pages/AppointmentsPage'
import BarbersPage from './pages/BarbersPage'
import { ServicesPage, ServicesAdminPage } from './pages/ServicesPage'
import WalkInPage from './pages/WalkInPage'
import CalendarPage from './pages/CalendarPage'
import SchedulePage from './pages/SchedulePage'
import POSPage from './pages/POSPage'
import {
  PayrollPage, DailySalesPage, ExpensesPage, PromotionsPage,
  PromotionsAdminPage, BranchesPage, UsersPage, BrandingPage,
  HistoryPage, ClientsPage, ProductSalesPage, StatsPage,
} from './pages/AdminPages'

// ── Protected layout ──────────────────────────────────────────────────────────
function AppLayout() {
  const { currentUser, authLoading } = useApp()

  if (authLoading) return (
    <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--brand-color)', borderTopColor: 'transparent' }} />
        <p className="font-display text-2xl" style={{ color: 'var(--brand-color)' }}>BARBERPRO</p>
      </div>
    </div>
  )

  if (!currentUser) return <Navigate to="/login" replace />

  return (
    <div className="h-screen w-full flex overflow-hidden bg-zinc-900 dark">
      <Sidebar />
      <main className="flex-1 overflow-auto lg:pt-0 pt-16">
        <Outlet />
      </main>
    </div>
  )
}

// ── Public layout ─────────────────────────────────────────────────────────────
function PublicLayout() {
  const { currentUser, authLoading } = useApp()
  if (authLoading) return null
  if (currentUser) return <Navigate to="/" replace />
  return <Outlet />
}

// ── Router ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<AuthPage />} />
      </Route>

      {/* Protected */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />

        {/* Client */}
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/my-appointments" element={<MyAppointmentsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />

        {/* Barber */}
        <Route path="/today" element={<TodayPage />} />
        <Route path="/walk-in" element={<WalkInPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/clients" element={<ClientsPage />} />

        {/* Shared */}
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/pos" element={<POSPage />} />

        {/* Admin */}
        <Route path="/daily-sales" element={<DailySalesPage />} />
        <Route path="/product-sales" element={<ProductSalesPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/appointments" element={<AllAppointmentsPage />} />
        <Route path="/barbers" element={<BarbersPage />} />
        <Route path="/services-admin" element={<ServicesAdminPage />} />
        <Route path="/promotions-admin" element={<PromotionsAdminPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/branding" element={<BrandingPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
        <ToastContainer />
        <Modal />
      </AppProvider>
    </BrowserRouter>
  )
}
