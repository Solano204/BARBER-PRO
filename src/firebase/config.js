// src/firebase/config.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// 🔑 Mueve estas variables a un archivo .env en producción:
// VITE_FIREBASE_API_KEY=...  etc.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAe2cNDqbF8gfc3BvThmXmI9hxBYHHbksg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mi-barberpro.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mi-barberpro",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mi-barberpro.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "508934409455",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:508934409455:web:20d3bf5741e87c94cadf1a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7RHP3THQYX",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
