# BarberPro — React + Vite Migration

Sistema integral de gestión de citas para barberías, migrado desde HTML monolítico a React moderno.

## Stack
- **React 18** + **Vite** (frontend)
- **Firebase** (Auth + Firestore, mismo proyecto que antes)
- **Tailwind CSS** (estilos)
- **React Router v6** (navegación)
- **Chart.js** (estadísticas)
- **Lucide React** (íconos)

## Instalación

```bash
# 1. Clonar / copiar el proyecto
cd barberpro

# 2. Instalar dependencias
npm install

# 3. (Opcional) Crear archivo de variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Firebase

# 4. Arrancar en desarrollo
npm run dev

# 5. Build para producción
npm run build
```

## Deploy en Vercel (gratis)

1. Sube el proyecto a GitHub
2. Ve a [vercel.com](https://vercel.com) y conecta tu repo
3. Agrega las variables de entorno de Firebase en el panel de Vercel
4. Deploy automático en cada `git push` ✅

## Estructura

```
src/
├── components/       # Piezas reutilizables (Sidebar, Modal, Toast)
├── context/          # AppContext — estado global (reemplaza window.appData)
├── firebase/         # config, auth, firestore helpers
├── hooks/            # (para futuros custom hooks)
├── pages/            # Cada vista en su propio archivo
│   ├── AuthPage.jsx
│   ├── Dashboard.jsx
│   ├── BookingPage.jsx
│   ├── AppointmentsPage.jsx
│   ├── BarbersPage.jsx
│   ├── ServicesPage.jsx
│   ├── WalkInPage.jsx
│   ├── CalendarPage.jsx
│   ├── SchedulePage.jsx
│   ├── POSPage.jsx
│   └── AdminPages.jsx  ← Payroll, DailySales, Expenses, Stats, etc.
└── utils/
    └── helpers.js    # formatDate, formatTime12h, getStatusColor, etc.
```

## Funcionalidades migradas ✅

- Login / Registro / Recuperación de contraseña
- Auto-activación de barberos pre-registrados
- Dashboard por rol (Admin / Barbero / Cliente)
- Reserva de citas con slots disponibles
- Citas de hoy (barbero)
- Venta directa (walk-in)
- Calendario interactivo
- Mi Horario / bloqueos de agenda
- Punto de Venta (POS) con carrito, cobro y ticket
- Historial de ventas POS con anulación y restauración de stock
- Nóminas y comisiones con pago, reversión y desglose
- Ventas diarias con navegación por fecha
- Gastos y control de flujo de caja
- Estadísticas con Chart.js (semana / mes / año)
- Administración: Barberos, Servicios, Usuarios, Sucursales, Promociones
- Marca Blanca (color, logo, nombre — sincronizado en tiempo real vía Firebase)
- Recordatorios por WhatsApp
- Sincronización en tiempo real con Firebase Realtime Listeners
- Diseño responsive (móvil + escritorio)

## Variables de entorno en Vercel

En el panel de tu proyecto en Vercel → Settings → Environment Variables, agrega:

| Key | Value |
|-----|-------|
| VITE_FIREBASE_API_KEY | tu api key |
| VITE_FIREBASE_AUTH_DOMAIN | tu auth domain |
| VITE_FIREBASE_PROJECT_ID | tu project id |
| VITE_FIREBASE_STORAGE_BUCKET | tu storage bucket |
| VITE_FIREBASE_MESSAGING_SENDER_ID | tu sender id |
| VITE_FIREBASE_APP_ID | tu app id |
