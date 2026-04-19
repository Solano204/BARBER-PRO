// src/pages/BarbersPage.jsx
import React from 'react'
import { Scissors, Edit2, Trash2, UserPlus, Mail } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addDocument, updateDocument, deleteDocument } from '../firebase/firestore'

export default function BarbersPage() {
  const { appData, showToast, showModal, closeModal } = useApp()

  const openAdd = () => {
    const branchOptions = [
      { id: 'main', name: 'Sucursal Principal' },
      ...appData.branches.map((b) => ({ id: b.id, name: b.branch_name })),
    ]
    showModal(<BarberForm mode="add" branches={branchOptions} onSave={saveNew} onClose={closeModal} />)
  }

  const openEdit = (barber) => {
    const branchOptions = [
      { id: 'main', name: 'Sucursal Principal' },
      ...appData.branches.map((b) => ({ id: b.id, name: b.branch_name })),
    ]
    showModal(<BarberForm mode="edit" barber={barber} branches={branchOptions}
      onSave={(data) => saveEdit(barber.id, data)} onClose={closeModal} appData={appData} />)
  }

  const saveNew = async (data) => {
    if (!data.name || !data.email || !data.pass) return showToast('Nombre, correo y contraseña son obligatorios', 'error')
    if (data.pass.length < 6) return showToast('Contraseña de mínimo 6 caracteres', 'error')
    try {
      const barberRef = await addDocument('barbers', {
        name: data.name, specialty: data.spec, email: data.email,
        branch_id: data.branchId, commission: Number(data.commission) || 50,
        rating: 5.0, created_at: new Date().toISOString(),
      })
      await addDocument('users', {
        name: data.name, email: data.email, role: 'barber',
        barber_id: barberRef.id, branch_id: data.branchId,
        pass_temporal: data.pass, created_at: new Date().toISOString(),
      })
      closeModal(); showToast('Barbero guardado correctamente', 'success')
    } catch (e) { showToast('Error al guardar', 'error') }
  }

  const saveEdit = async (id, data) => {
    try {
      await updateDocument('barbers', id, {
        name: data.name, specialty: data.spec, branch_id: data.branchId,
        email: data.email, commission: Number(data.commission) || 50,
      })
      const userRecord = appData.users.find((u) => u.barber_id === id)
      if (userRecord?.id) {
        const updates = { name: data.name, email: data.email, branch_id: data.branchId }
        if (data.pass) updates.pass_temporal = data.pass
        await updateDocument('users', userRecord.id, updates)
      }
      closeModal(); showToast('Barbero actualizado', 'success')
    } catch { showToast('Error al actualizar', 'error') }
  }

  const deleteBarber = async (id) => {
    if (!window.confirm('¿Eliminar a este barbero permanentemente?')) return
    try {
      await deleteDocument('barbers', id)
      const userRecord = appData.users.find((u) => u.barber_id === id)
      if (userRecord?.id) await deleteDocument('users', userRecord.id)
      showToast('Barbero eliminado', 'success')
    } catch { showToast('Error al eliminar', 'error') }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-white tracking-wide uppercase">BARBEROS</h1>
          <p className="text-zinc-400 mt-1">Administra tu equipo de trabajo</p>
        </div>
        <button onClick={openAdd} className="gradient-gold text-zinc-900 px-5 py-3 rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto">
          <UserPlus className="w-5 h-5" /> Añadir Barbero
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {appData.barbers.map((b) => (
          <div key={b.id} className="glass rounded-3xl p-6 flex flex-col border border-zinc-700/50 shadow-lg">
            <div className="text-center flex-1">
              <div className="w-24 h-24 bg-zinc-700 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-[color:var(--brand-color)]/20 shadow-xl">
                <Scissors className="w-10 h-10" style={{ color: 'var(--brand-color)' }} />
              </div>
              <h3 className="font-display text-2xl text-white mb-1">{b.name}</h3>
              <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--brand-color)' }}>{b.specialty || 'Barbero General'}</p>
              <p className="text-zinc-500 text-xs"><Mail className="w-3 h-3 inline mr-1" />{b.email || 'Sin correo'}</p>
              <p className="text-xs text-zinc-500 mt-1">Comisión: {b.commission || 50}%</p>
            </div>
            <div className="flex gap-3 mt-6 pt-5 border-t border-zinc-700/50">
              <button onClick={() => openEdit(b)} className="flex-1 bg-zinc-800 hover:bg-[color:var(--brand-color)] hover:text-zinc-900 text-white py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm font-bold">
                <Edit2 className="w-4 h-4" /> Editar
              </button>
              <button onClick={() => deleteBarber(b.id)} className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white py-3 rounded-xl transition flex justify-center items-center gap-2 text-sm font-bold border border-red-500/20 hover:border-transparent">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        ))}

        {appData.barbers.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-zinc-800/30 rounded-3xl border border-zinc-700/50">
            <p className="text-zinc-300 text-xl">Aún no hay barberos registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}

function BarberForm({ mode, barber, branches, onSave, onClose, appData }) {
  const [name, setName] = React.useState(barber?.name || '')
  const [spec, setSpec] = React.useState(barber?.specialty || '')
  const [email, setEmail] = React.useState(barber?.email || '')
  const [pass, setPass] = React.useState('')
  const [branchId, setBranchId] = React.useState(barber?.branch_id || 'main')
  const [commission, setCommission] = React.useState(barber?.commission || 50)
  const [loading, setLoading] = React.useState(false)

  const handle = async () => {
    setLoading(true)
    await onSave({ name, spec, email, pass, branchId, commission })
    setLoading(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-white uppercase tracking-wide">
          {mode === 'add' ? 'AÑADIR BARBERO' : 'EDITAR BARBERO'}
        </h2>
        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white">✕</button>
      </div>
      <div className="space-y-4 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo"
          className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
        <div className="grid grid-cols-3 gap-3">
          <input value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="Especialidad"
            className="bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
            className="bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none appearance-none">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="Comisión %"
            className="bg-[color:var(--brand-color)]/10 border border-[color:var(--brand-color)]/30 rounded-xl py-3 px-4 font-bold outline-none" style={{ color: 'var(--brand-color)' }} />
        </div>
        <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-xl p-4 space-y-3">
          <p className="text-indigo-400 font-medium text-sm">Datos de Acceso</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo"
              className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl py-3 px-4 text-white outline-none" />
            <input type="text" value={pass} onChange={(e) => setPass(e.target.value)}
              placeholder={mode === 'edit' ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl py-3 px-4 text-white outline-none" />
          </div>
        </div>
      </div>
      <button onClick={handle} disabled={loading} className="w-full gradient-gold text-zinc-900 py-3 rounded-xl font-bold transition flex justify-center gap-2 disabled:opacity-60">
        {loading ? 'Guardando...' : mode === 'add' ? 'Guardar Barbero' : 'Guardar Cambios'}
      </button>
    </div>
  )
}
