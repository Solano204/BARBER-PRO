// src/firebase/auth.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { collection, query, where, getDocs, setDoc, doc, deleteDoc, addDoc } from 'firebase/firestore'
import { auth, db } from './config'

export const loginUser = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
}

export const logoutUser = () => signOut(auth)

export const sendPasswordReset = (email) => sendPasswordResetEmail(auth, email)

export const registerClient = async (name, email, phone, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = userCredential.user.uid

  // Check if admin pre-registered this email
  const q = query(collection(db, 'users'), where('email', '==', email))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    const existingData = snapshot.docs[0].data()
    const oldDocId = snapshot.docs[0].id
    await setDoc(doc(db, 'users', uid), {
      ...existingData,
      phone,
      created_at: new Date().toISOString(),
    })
    if (oldDocId !== uid) await deleteDoc(doc(db, 'users', oldDocId))
    return { type: 'barber_activated' }
  } else {
    await setDoc(doc(db, 'users', uid), {
      name, email, phone, role: 'client',
      created_at: new Date().toISOString(),
    })
    return { type: 'client_created' }
  }
}

// Auto-activate a pre-registered barber on first login
export const tryBarberAutoActivation = async (email, password) => {
  const q = query(
    collection(db, 'users'),
    where('email', '==', email),
    where('role', '==', 'barber')
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return false

  const barberDoc = snapshot.docs[0]
  const barberData = barberDoc.data()
  if (barberData.pass_temporal !== password) return false

  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const newUid = userCredential.user.uid

  await setDoc(doc(db, 'users', newUid), {
    ...barberData,
    pass_temporal: '',
    uid: newUid,
  })
  if (barberDoc.id !== newUid) await deleteDoc(doc(db, 'users', barberDoc.id))
  return true
}
