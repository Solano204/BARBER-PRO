// src/pages/ServicesPage.jsx
import React from 'react'
import { Scissors, Edit2, Trash2, Plus, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addDocument, updateDocument, deleteDocument } from '../firebase/firestore'
import { useNavigate } from 'react-router-dom'

// ─── CLIENT VIEW ──────────────────────────────────────────────────────────────
export function ServicesPage() {
  const { appData } = useApp()
  const navigate = useNavigate()

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in">
      <div className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="font-display text-3xl md:text-4xl text-white mb-2">NUESTROS SERVICIOS</h1>
        <p className="text-zinc-400">Descubre todo lo que ofrecemos para tu estilo</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {appData.services.map((svc) => (
          <div key={svc.id} className="glass rounded-2xl p-6 hover:bg-[color:var(--brand-color)]/5 transition group flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 gradient-gold rounded-xl flex items-center justify-center group-hover:scale-110 transition shrink-0">
                <Scissors className="w-7 h-7 text-zinc-900" />
              </div>
              <div className="text-right">
                <p className="font-display text-3xl" style={{ color: 'var(--brand-color)' }}>${svc.price}</p>
                <p className="text-xs text-zinc-500">{svc.duration} min</p>
              </div>
            </div>
            <h3 className="font-display text-xl text-white mb-2">{svc.name}</h3>
            <p className="text-zinc-400 text-sm mb-6 flex-1">{svc.description}</p>
            <button
              onClick={() => navigate('/book')}
              className="w-full bg-zinc-700 hover:gradient-gold text-white hover:text-zinc-900 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
            >
              <Scissors className="w-4 h-4" /> Reservar
            </button>
          </div>
        ))}
        {appData.services.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-zinc-800/30 rounded-3xl border border-zinc-700/50">
            <Scissors className="w-16 h-16 text-zinc-600 mx-auto mb-4 opacity-30" />
            <p className="text-zinc-300 text-xl">Próximamente agregaremos nuestros servicios.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
export function ServicesAdminPage() {
  const { appData, showToast, showModal, closeModal } = useApp()

  const openAdd = () => showModal(<ServiceForm mode="add" onSave={saveNew} onClose={closeModal} />)
  const openEdit = (svc) => showModal(<ServiceForm mode="edit" service={svc} onSave={(d) => saveEdit(svc.id, d)} onClose={closeModal} />)

  const saveNew = async (data) => {
    if (!data.name || !data.price || !data.duration) return showToast('Nombre, precio y duración son requeridos', 'error')
    try {
      await addDocument('services', {
        name: data.name, description: data.desc,
        price: Number(data.price), duration: Number(data.duration),
      })
      closeModal(); showToast('Servicio guardado', 'success')
    } catch { showToast('Error al guardar', 'error') }
  }

  const saveEdit = async (id, data) => {
    if (!data.name || !data.price || !data.duration) return showToast('Completa los campos obligatorios', 'error')
    try {
      await updateDocument('services', id, {
        name: data.name, description: data.desc,
        price: Number(data.price), duration: Number(data.duration),
      })
      closeModal(); showToast('Servicio actualizado', 'success')
    } catch { showToast('Error al actualizar', 'error') }
  }

  const deleteSvc = async (id) => {
    if (!window.confirm('¿Eliminar este servicio permanentemente?')) return
    try { await deleteDocument('services', id); showToast('Servicio eliminado', 'success') }
    catch { showToast('Error al eliminar', 'error') }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-white tracking-wide uppercase">SERVICIOS</h1>
          <p className="text-zinc-400 mt-1">Administra tu catálogo de cortes y precios</p>
        </div>
        <button onClick={openAdd} className="gradient-gold text-zinc-900 px-5 py-3 rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto">
          <Plus className="w-5 h-5" /> Añadir Servicio
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {appData.services.map((s) => (
          <div key={s.id} className="glass rounded-3xl p-6 flex flex-col border border-zinc-700/50 shadow-lg hover:bg-zinc-800/50 transition">
            <div className="flex justify-between items-start mb-2 gap-4">
              <h3 className="font-display text-2xl text-white leading-tight">{s.name}</h3>
              <p className="font-display text-3xl shrink-0" style={{ color: 'var(--brand-color)' }}>${s.price}</p>
            </div>
            <div className="mb-6 flex-1">
              <p className="text-zinc-400 text-sm mb-3">{s.description || 'Sin descripción'}</p>
              <span className="inline-flex items-center gap-1 bg-zinc-900/80 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-zinc-700">
                <Clock className="w-4 h-4" /> {s.duration} min
              </span>
            </div>
            <div className="flex gap-3 mt-auto pt-5 border-t border-zinc-700/50">
              <button onClick={() => openEdit(s)} className="flex-1 bg-zinc-800 hover:bg-[color:var(--brand-color)] hover:text-zinc-900 text-white py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm font-bold">
                <Edit2 className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => deleteSvc(s.id)} className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm font-bold border border-red-500/20 hover:border-transparent">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        ))}
        {appData.services.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-zinc-800/30 rounded-3xl border border-zinc-700/50">
            <Scissors className="w-16 h-16 text-zinc-600 mx-auto mb-4 opacity-50" />
            <p className="text-zinc-300 text-xl">Aún no hay servicios registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ServiceForm({ mode, service, onSave, onClose }) {
  const [name, setName] = React.useState(service?.name || '')
  const [desc, setDesc] = React.useState(service?.description || '')
  const [price, setPrice] = React.useState(service?.price || '')
  const [duration, setDuration] = React.useState(service?.duration || '')
  const [loading, setLoading] = React.useState(false)

  const handle = async () => { setLoading(true); await onSave({ name, desc, price, duration }); setLoading(false) }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-white uppercase tracking-wide">
          {mode === 'add' ? 'AÑADIR SERVICIO' : 'EDITAR SERVICIO'}
        </h2>
        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-red-400 transition">✕</button>
      </div>
      <div className="space-y-4 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del servicio"
          className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción"
          className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
        <div className="grid grid-cols-2 gap-4">
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio ($)"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
          <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duración (min)"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
        </div>
      </div>
      <button onClick={handle} disabled={loading}
        className={`w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-60 ${mode === 'add' ? 'gradient-gold text-zinc-900' : 'bg-blue-500 hover:bg-blue-400 text-white'}`}>
        {loading ? 'Guardando...' : mode === 'add' ? 'Guardar Servicio' : 'Guardar Cambios'}
      </button>
    </div>
  )
}
