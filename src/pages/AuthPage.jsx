// src/pages/AuthPage.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, Mail, Lock, User, Phone, ArrowRight, UserPlus, Eye, EyeOff, CalendarCheck, Users, Store } from 'lucide-react'
import { loginUser, registerClient, tryBarberAutoActivation, sendPasswordReset } from '../firebase/auth'
import { useApp } from '../context/AppContext'

export default function AuthPage() {
  const { showToast, branding } = useApp()
  const navigate = useNavigate()
  const [view, setView] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return showToast('Completa todos los campos', 'error')
    setLoading(true)
    try {
      await loginUser(loginEmail.trim().toLowerCase(), loginPassword)
      navigate('/')
    } catch {
      try {
        const activated = await tryBarberAutoActivation(loginEmail.trim().toLowerCase(), loginPassword)
        if (activated) { navigate('/'); return }
      } catch {}
      showToast('Credenciales incorrectas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!loginEmail) return showToast('Escribe tu correo arriba primero', 'warning')
    try {
      setLoading(true)
      await sendPasswordReset(loginEmail.trim().toLowerCase())
      showToast('¡Enlace enviado! Revisa tu bandeja de entrada o SPAM', 'success')
    } catch (e) {
      showToast('Error al enviar correo. Verifica el email.', 'error')
    } finally { setLoading(false) }
  }

  const handleRegister = async () => {
    if (!regName || !regEmail || !regPhone || !regPassword) return showToast('Completa todos los campos', 'error')
    setLoading(true)
    try {
      const result = await registerClient(regName, regEmail.trim().toLowerCase(), regPhone, regPassword)
      showToast(result.type === 'barber_activated' ? '¡Cuenta activada!' : '¡Cuenta creada!', 'success')
      navigate('/')
    } catch (e) {
      showToast('Error: ' + e.message, 'error')
    } finally { setLoading(false) }
  }

  const brandColor = branding?.primaryColor || '#FBBF24'

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="lg:w-1/2 bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill={brandColor} />
            </pattern>
            <rect width="100" height="100" fill="url(#pattern)" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: brandColor }}>
              <Scissors className="w-6 h-6 text-zinc-900" />
            </div>
            <h1 className="font-display text-4xl lg:text-5xl" style={{ color: brandColor }}>
              {branding?.shopName || 'BARBERPRO'}
            </h1>
          </div>
          <p className="text-2xl lg:text-3xl text-white/80 mb-4">Tu estilo, nuestra pasión</p>
          <p className="text-zinc-400 max-w-md">
            Sistema integral de gestión de citas para barberías modernas. Reserva, gestiona y haz crecer tu negocio.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { Icon: CalendarCheck, label: 'Reservas Online' },
              { Icon: Users, label: 'Multi-Barbero' },
              { Icon: Store, label: 'Multi-Sucursal' },
            ].map(({ Icon, label }) => (
              <div key={label} className="glass rounded-xl p-4 text-center">
                <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: brandColor }} />
                <p className="text-sm text-zinc-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="lg:w-1/2 bg-zinc-900 p-8 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md">
          {view === 'login' ? (
            <div className="fade-in">
              <h2 className="font-display text-3xl text-white mb-2">INICIAR SESIÓN</h2>
              <p className="text-zinc-400 mb-8">Accede a tu cuenta para gestionar tus citas</p>
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input type="email" placeholder="tu@email.com" value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:border-[color:var(--brand-color)] focus:outline-none transition" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-zinc-400">Contraseña</label>
                    <button onClick={handleForgotPassword} className="text-xs hover:underline" style={{ color: brandColor }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-11 pr-12 text-white placeholder-zinc-500 focus:border-[color:var(--brand-color)] focus:outline-none transition" />
                    <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button onClick={handleLogin} disabled={loading}
                  className="w-full gradient-gold text-zinc-900 font-semibold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /> : <><span>Entrar</span><ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
              <div className="mt-6 text-center">
                <p className="text-zinc-400">¿No tienes cuenta?{' '}
                  <button onClick={() => setView('register')} className="hover:underline" style={{ color: brandColor }}>Regístrate</button>
                </p>
              </div>
            </div>
          ) : (
            <div className="fade-in">
              <h2 className="font-display text-3xl text-white mb-2">CREAR CUENTA</h2>
              <p className="text-zinc-400 mb-8">Únete y reserva tu próxima cita</p>
              <div className="space-y-4">
                {[
                  { Icon: User, placeholder: 'Tu nombre', value: regName, onChange: setRegName, type: 'text' },
                  { Icon: Mail, placeholder: 'tu@email.com', value: regEmail, onChange: setRegEmail, type: 'email' },
                  { Icon: Phone, placeholder: '+34 600 000 000', value: regPhone, onChange: setRegPhone, type: 'tel' },
                ].map(({ Icon, placeholder, value, onChange, type }) => (
                  <div key={placeholder} className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input type={type} placeholder={placeholder} value={value}
                      onChange={(e) => onChange(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:border-[color:var(--brand-color)] focus:outline-none transition" />
                  </div>
                ))}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-11 pr-12 text-white placeholder-zinc-500 focus:border-[color:var(--brand-color)] focus:outline-none transition" />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button onClick={handleRegister} disabled={loading}
                  className="w-full gradient-gold text-zinc-900 font-semibold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" /> : <><span>Crear Cuenta</span><UserPlus className="w-5 h-5" /></>}
                </button>
              </div>
              <div className="mt-6 text-center">
                <p className="text-zinc-400">¿Ya tienes cuenta?{' '}
                  <button onClick={() => setView('login')} className="hover:underline" style={{ color: brandColor }}>Inicia sesión</button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
