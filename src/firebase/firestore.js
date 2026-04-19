// src/firebase/firestore.js
import {
  collection, addDoc, getDocs, updateDoc, doc,
  onSnapshot, query, where, setDoc, deleteDoc, orderBy, getDoc,
} from 'firebase/firestore'
import { db } from './config'

// ── Generic helpers ────────────────────────────────────────────────────────────
export const addDocument = (col, data) => addDoc(collection(db, col), data)

export const updateDocument = (col, id, data) => updateDoc(doc(db, col, id), data)

export const deleteDocument = (col, id) => deleteDoc(doc(db, col, id))

export const getDocument = async (col, id) => {
  const snap = await getDoc(doc(db, col, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Real-time listeners ────────────────────────────────────────────────────────
export const listenCollection = (col, callback) =>
  onSnapshot(collection(db, col), (snap) =>
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
  )

export const listenDocumentsByDateRange = (col, dateLimit, callback) => {
  const q = query(collection(db, col), where('date', '>=', dateLimit))
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
  )
}

export const listenUserDoc = (uid, callback) =>
  onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) callback({ ...snap.data(), id: snap.id })
  })

export const listenBranding = (callback) =>
  onSnapshot(collection(db, 'branding'), (snap) => {
    if (!snap.empty) callback({ id: snap.docs[0].id, ...snap.docs[0].data() })
  })

// ── Specific queries ───────────────────────────────────────────────────────────
export const saveBranding = async (data) => {
  const savedId = localStorage.getItem('barber_branding_id')
  if (savedId) {
    await updateDoc(doc(db, 'branding', savedId), data)
    return savedId
  }
  const ref = await addDoc(collection(db, 'branding'), data)
  localStorage.setItem('barber_branding_id', ref.id)
  return ref.id
}
