// src/components/Toast.jsx
import React from 'react'
import { useApp } from '../context/AppContext'

export function ToastContainer() {
  const { toasts } = useApp()
  return (
    <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl flex items-center gap-2 text-white shadow-lg fade-in ${
            t.type === 'success' ? 'bg-green-500' :
            t.type === 'error'   ? 'bg-red-500' :
            t.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
          }`}
        >
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
