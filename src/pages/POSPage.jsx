// src/pages/POSPage.jsx
import React, { useState } from 'react'
import { ShoppingCart, PlusCircle, Trash2, Banknote, PackageX, Boxes, Edit2, Package } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { addDocument, updateDocument, deleteDocument } from '../firebase/firestore'
import { getTodayStr, formatDate, formatTime12h } from '../utils/helpers'

export default function POSPage() {
  const { currentUser, appData, showToast, showModal, closeModal } = useApp()
  const [cart, setCart] = useState([])
  const isAdmin = currentUser?.role === 'admin'

  const addToCart = (product) => {
    if (product.stock <= 0) return
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id)
      if (existing) {
        if (existing.qty >= product.stock) { showToast('No hay más stock', 'warning'); return prev }
        return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  const removeFromCart = (id) => setCart((prev) => prev.filter((i) => i.id !== id))

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const checkout = () => {
    if (cart.length === 0) return
    showModal(<CheckoutModal cart={cart} total={total} onConfirm={processSale} onClose={closeModal} />)
  }

  const processSale = async (tendered) => {
    const now = new Date()
    const dateStr = getTodayStr()
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
    const items = cart.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
    const change = tendered - total

    try {
      const saleRef = await addDocument('product_sales', {
        type: 'product_sale', items, total, tendered, change, date: dateStr, time: timeStr,
        created_at: now.toISOString(), seller_id: currentUser.id,
        branch_id: currentUser.branch_id || 'main',
      })
      // Descuento de stock
      for (const item of cart) {
        const prod = appData.products.find((p) => p.id === item.id)
        if (prod) await updateDocument('products', item.id, { stock: prod.stock - item.qty })
      }
      showToast('¡Venta exitosa!', 'success')
      closeModal()
      setCart([])
      printTicket({ items, total, tendered, change, date: dateStr, time: timeStr }, saleRef.id, showModal, closeModal)
    } catch { showToast('Error al procesar la venta', 'error') }
  }

  const openAddProduct = () => showModal(<ProductForm mode="add" onSave={saveNewProduct} onClose={closeModal} />)
  const openEditProduct = (p) => showModal(<ProductForm mode="edit" product={p} onSave={(d) => saveEditProduct(p.id, d)} onClose={closeModal} />)

  const saveNewProduct = async (data) => {
    if (!data.name || !data.price || !data.stock) return showToast('Llena todos los campos', 'error')
    try { await addDocument('products', { name: data.name, price: Number(data.price), stock: Number(data.stock), created_at: new Date().toISOString() }); closeModal(); showToast('Producto agregado', 'success') }
    catch { showToast('Error', 'error') }
  }

  const saveEditProduct = async (id, data) => {
    if (!data.name || !data.price || !data.stock) return showToast('Llena todos los campos', 'error')
    try { await updateDocument('products', id, { name: data.name, price: Number(data.price), stock: Number(data.stock) }); closeModal(); showToast('Producto actualizado', 'success') }
    catch { showToast('Error', 'error') }
  }

  const deleteProduct = async (id) => {
    if (!window.confirm('¿Eliminar este producto del inventario?')) return
    try { await deleteDocument('products', id); showToast('Producto eliminado', 'success') }
    catch { showToast('Error', 'error') }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 fade-in h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 shrink-0">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-white uppercase tracking-wide">PUNTO DE VENTA</h1>
          <p className="text-zinc-400 text-sm">Venta de productos e inventario</p>
        </div>
        {isAdmin && (
          <button onClick={openAddProduct} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white px-5 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg">
            <Boxes className="w-5 h-5" style={{ color: 'var(--brand-color)' }} /> Nuevo Producto
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Product grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {appData.products.map((p) => {
              const isOut = p.stock <= 0
              return (
                <div key={p.id} className={`bg-zinc-800/80 border ${isOut ? 'border-red-500/30 opacity-60' : 'border-zinc-700/50'} rounded-2xl p-4 flex flex-col justify-between hover:border-[color:var(--brand-color)]/50 transition`}>
                  <div>
                    <div className="w-full h-32 bg-zinc-900 rounded-xl mb-3 flex items-center justify-center border border-zinc-700/50">
                      <Package className="w-10 h-10" style={{ color: isOut ? undefined : 'color-mix(in srgb, var(--brand-color) 50%, transparent)' }} />
                    </div>
                    <h3 className="text-white font-medium text-lg leading-tight mb-1">{p.name}</h3>
                    <p className="font-display text-2xl mb-2" style={{ color: 'var(--brand-color)' }}>${p.price}</p>
                  </div>
                  <div className="mt-auto">
                    <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${isOut ? 'text-red-400' : 'text-zinc-400'}`}>
                      {isOut ? 'Agotado' : `Stock: ${p.stock}`}
                    </p>
                    <button onClick={() => addToCart(p)} disabled={isOut}
                      className={`w-full py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-2 ${isOut ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'text-white hover:text-zinc-900 hover:gradient-gold'}`}
                      style={!isOut ? { background: 'color-mix(in srgb, var(--brand-color) 20%, transparent)', color: 'var(--brand-color)' } : {}}>
                      <PlusCircle className="w-4 h-4" /> {isOut ? 'Sin Stock' : 'Agregar'}
                    </button>
                    {isAdmin && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-700/50">
                        <button onClick={() => openEditProduct(p)} className="flex-1 bg-zinc-700 hover:bg-[color:var(--brand-color)] hover:text-zinc-900 text-white py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1">
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                        <button onClick={() => deleteProduct(p.id)} className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border border-red-500/20 hover:border-transparent">
                          <Trash2 className="w-3 h-3" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {appData.products.length === 0 && (
              <div className="col-span-full text-center py-12">
                <PackageX className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">Inventario vacío. {isAdmin ? 'Agrega tu primer producto.' : ''}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="w-full lg:w-96 flex flex-col shrink-0">
          <div className="glass rounded-3xl border border-[color:var(--brand-color)]/30 shadow-2xl flex flex-col overflow-hidden" style={{ height: 'min(600px, 80vh)' }}>
            <div className="bg-zinc-800/80 p-4 border-b border-zinc-700/50 shrink-0">
              <h2 className="font-display text-2xl text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" style={{ color: 'var(--brand-color)' }} /> Carrito Actual
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-zinc-900/50">
              {cart.length > 0 ? cart.map((item) => (
                <div key={item.id} className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium text-sm">{item.name}</p>
                    <p className="text-xs font-bold mt-1" style={{ color: 'var(--brand-color)' }}>${item.price} x {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-white font-bold">${(item.price * item.qty).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-zinc-500 hover:text-red-400 p-1.5 bg-zinc-900 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                  <ShoppingCart className="w-12 h-12 mb-2" />
                  <p className="text-sm">Carrito vacío</p>
                </div>
              )}
            </div>
            <div className="p-5 bg-zinc-800/90 border-t border-[color:var(--brand-color)]/30 shrink-0">
              <div className="flex justify-between items-end mb-4">
                <span className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Total:</span>
                <span className="font-display text-4xl text-green-400">${total.toFixed(2)}</span>
              </div>
              <button onClick={checkout} disabled={cart.length === 0}
                className="w-full gradient-gold text-zinc-900 py-4 rounded-xl font-bold text-lg transition flex justify-center items-center gap-2 shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                <Banknote className="w-6 h-6" /> Cobrar e Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Checkout Modal ─────────────────────────────────────────────────────────────
function CheckoutModal({ cart, total, onConfirm, onClose }) {
  const [tendered, setTendered] = useState('')
  const change = Number(tendered) >= total ? Number(tendered) - total : null

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-white uppercase tracking-wide">COBRO DE PRODUCTOS</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
      </div>
      <div className="text-center mb-6">
        <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-1">Total a Pagar</p>
        <p className="font-display text-5xl text-green-400">${total.toFixed(2)}</p>
      </div>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm text-zinc-400 mb-2 font-bold uppercase tracking-wider">¿Con cuánto paga el cliente?</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-display text-2xl">$</span>
            <input type="number" value={tendered} onChange={(e) => setTendered(e.target.value)}
              placeholder="Ej. 500" autoFocus
              className="w-full bg-zinc-900 border border-zinc-600 rounded-xl py-4 pl-10 pr-4 text-white font-display text-3xl focus:border-[color:var(--brand-color)] outline-none transition" />
          </div>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 flex justify-between items-center">
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Cambio a Devolver:</p>
          <p className={`font-display text-3xl ${change !== null ? '' : 'text-red-400'}`} style={change !== null ? { color: 'var(--brand-color)' } : {}}>
            {change !== null ? `$${change.toFixed(2)}` : 'Falta dinero'}
          </p>
        </div>
      </div>
      <button onClick={() => onConfirm(Number(tendered))} disabled={change === null}
        className="w-full gradient-gold text-zinc-900 py-4 rounded-xl font-bold text-lg transition flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
        <Banknote className="w-6 h-6" /> Confirmar Venta
      </button>
    </div>
  )
}

// ── Product Form ───────────────────────────────────────────────────────────────
function ProductForm({ mode, product, onSave, onClose }) {
  const [name, setName] = useState(product?.name || '')
  const [price, setPrice] = useState(product?.price || '')
  const [stock, setStock] = useState(product?.stock || '')
  const [loading, setLoading] = useState(false)

  const handle = async () => { setLoading(true); await onSave({ name, price, stock }); setLoading(false) }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-white uppercase tracking-wide">{mode === 'add' ? 'NUEVO PRODUCTO' : 'EDITAR PRODUCTO'}</h2>
        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white">✕</button>
      </div>
      <div className="space-y-4 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del producto"
          className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
        <div className="grid grid-cols-2 gap-4">
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio ($)"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
          <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock (piezas)"
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl py-3 px-4 text-white focus:border-[color:var(--brand-color)] outline-none" />
        </div>
      </div>
      <button onClick={handle} disabled={loading} className="w-full gradient-gold text-zinc-900 py-4 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? 'Guardando...' : mode === 'add' ? 'Guardar Producto' : 'Guardar Cambios'}
      </button>
    </div>
  )
}

// ── Ticket printer ─────────────────────────────────────────────────────────────
function printTicket(sale, ticketId, showModal, closeModal) {
  const branding = JSON.parse(localStorage.getItem('barber_branding') || '{}')
  const shopName = branding.shopName || 'BARBERPRO'

  const itemsHtml = sale.items.map((i) =>
    `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>${i.qty}x ${i.name}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`
  ).join('')

  const html = `<div style="font-family:monospace;width:300px;margin:0 auto;padding:20px;background:white;color:black;border:1px solid #ddd;">
    <div style="text-align:center;border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px;">
      <h2 style="margin:0;font-size:24px;font-weight:bold;text-transform:uppercase;">${shopName}</h2>
      <p style="margin:4px 0 0;font-size:12px;">TICKET DE COMPRA</p>
    </div>
    <div style="font-size:12px;margin-bottom:10px;">
      <p style="margin:2px 0;">Folio: #${ticketId.substring(0,6).toUpperCase()}</p>
      <p style="margin:2px 0;">Fecha: ${formatDate(sale.date)} ${formatTime12h(sale.time)}</p>
    </div>
    <div style="border-bottom:2px dashed #000;padding-bottom:10px;margin-bottom:10px;">${itemsHtml}</div>
    <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:bold;margin-bottom:8px;"><span>TOTAL:</span><span>$${sale.total.toFixed(2)}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:4px;"><span>Efectivo:</span><span>$${(sale.tendered||sale.total).toFixed(2)}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:20px;"><span>Cambio:</span><span>$${(sale.change||0).toFixed(2)}</span></div>
    <div style="text-align:center;font-size:11px;"><p>¡Gracias por tu preferencia!</p></div>
  </div>`

  showModal(
    <div className="p-6 flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-4">
        <h2 className="font-display text-2xl text-white uppercase tracking-wide">Ticket de Venta</h2>
        <button onClick={closeModal} className="text-zinc-400 hover:text-white">✕</button>
      </div>
      <div id="print-pos-area" className="mb-6 w-full flex justify-center" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={closeModal} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition">Cerrar</button>
        <button onClick={() => {
          const w = window.open('','_blank')
          w.document.body.innerHTML = html
          setTimeout(() => { w.print(); w.close() }, 500)
        }} className="flex-1 gradient-gold text-zinc-900 py-3 rounded-xl font-bold transition shadow-lg flex justify-center items-center gap-2">
          🖨️ Imprimir
        </button>
      </div>
    </div>
  )
}
