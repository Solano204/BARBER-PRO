// src/components/Modal.jsx
import React from 'react'
import { useApp } from '../context/AppContext'

export function Modal() {
  const { modal, closeModal } = useApp()
  if (!modal) return null
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div className="bg-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {modal}
      </div>
    </div>
  )
}
