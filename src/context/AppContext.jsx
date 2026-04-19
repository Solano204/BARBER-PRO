// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import {
  listenCollection,
  listenDocumentsByDateRange,
  listenUserDoc,
  listenBranding,
} from '../firebase/firestore'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [appData, setAppData] = useState({
    users: [], services: [], appointments: [], promotions: [],
    blockedSlots: [], schedules: [], branches: [], barbers: [],
    expenses: [], products: [], product_sales: [],
  })
  const [branding, setBranding] = useState(() => {
    return JSON.parse(localStorage.getItem('barber_branding') || 'null') || {
      shopName: 'BARBERPRO', primaryColor: '#FBBF24', logoUrl: '', photoStyle: 'normal',
    }
  })
  const [toasts, setToasts] = useState([])
  const [modal, setModal] = useState(null) // { content: ReactNode }

  // Apply brand color CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', branding.primaryColor || '#FBBF24')
    if (branding.shopName) document.title = branding.shopName + ' - BarberPro'
  }, [branding])

  // Toast helpers
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200)
  }, [])

  const showModal = useCallback((content) => setModal(content), [])
  const closeModal = useCallback(() => setModal(null), [])

  // Auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null)
        setAuthLoading(false)
        return
      }
      // Listen to this user's Firestore doc for real-time role/profile updates
      const unsubUser = listenUserDoc(firebaseUser.uid, (userData) => {
        setCurrentUser({ ...userData, id: firebaseUser.uid })
        setAuthLoading(false)
      })
      return unsubUser
    })
    return unsubAuth
  }, [])

  // Realtime data listeners (only when logged in)
  useEffect(() => {
    if (!currentUser) return
    const unsubs = []

    const staticCollections = ['services', 'users', 'promotions', 'branches', 'barbers', 'products', 'blockedSlots']
    staticCollections.forEach((col) => {
      unsubs.push(
        listenCollection(col, (data) =>
          setAppData((prev) => ({ ...prev, [col]: data }))
        )
      )
    })

    // Big collections: last 30 days only
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dateLimit = thirtyDaysAgo.toISOString().split('T')[0]

    const bigCollections = ['appointments', 'product_sales', 'expenses']
    bigCollections.forEach((col) => {
      unsubs.push(
        listenDocumentsByDateRange(col, dateLimit, (data) =>
          setAppData((prev) => ({ ...prev, [col]: data }))
        )
      )
    })

    // Branding sync
    unsubs.push(
      listenBranding((cloudBrand) => {
        const local = JSON.parse(localStorage.getItem('barber_branding') || '{}')
        if (cloudBrand.updated_at && cloudBrand.updated_at !== local.updated_at) {
          localStorage.setItem('barber_branding', JSON.stringify(cloudBrand))
          localStorage.setItem('barber_branding_id', cloudBrand.id)
          setBranding(cloudBrand)
        }
      })
    )

    return () => unsubs.forEach((u) => u())
  }, [currentUser?.id])

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      authLoading,
      appData, setAppData,
      branding, setBranding,
      toasts,
      showToast,
      modal, showModal, closeModal,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
