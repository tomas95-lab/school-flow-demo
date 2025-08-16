# 🚀 SchoolFlow MVP - README Interno para Demos

## 📋 Requisitos Rápidos

- **Node.js** 18+ 
- **PNPM** (recomendado) o **NPM**
- **Firebase CLI** (`npm i -g firebase-tools`)
- **Cuenta Firebase** con proyecto creado

## ⚡ Setup en 5 Comandos

```bash
# 1. Instalar dependencias
pnpm install

# 2. Copiar variables de entorno
cp env.example .env.local

# 3. Configurar Firebase (crear proyecto en console.firebase.google.com)
firebase login
firebase use --add

# 4. Cargar datos semilla
pnpm run seed:demo

# 5. Ejecutar demo
pnpm run dev
```

## 🔑 Credenciales Dummy (Demo)

```env
# .env.local - Reemplazar con tu proyecto
VITE_FIREBASE_API_KEY=AIzaSyC_dummy_key_for_demo
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

## 👥 Usuarios de Prueba (Creados por seed:demo)

- **Admin**: `admin1@example.com` / `password123`
- **Docente**: `doc1@example.com` / `password123`  
- **Alumno**: `al1@example.com` / `password123`

## 🎯 Cómo Correr Demo (Dataset Semilla)

```bash
# Limpiar y cargar desde cero
pnpm run clean-collections
pnpm run seed:demo

# Verificar datos cargados
pnpm run list-collections
```

## 🎬 Guión de Demo de 15' (Paso a Paso)

### **Min 0-1: Login y Presentación**
- URL: `http://localhost:5173/login`
- Login como `admin1@example.com`
- Mostrar dashboard principal

### **Min 1-3: Dashboard y KPIs** 
- URL: `http://localhost:5173/app/dashboard`
- Explicar métricas: total alumnos, cursos, promedio general
- Navegar por sidebar (módulos disponibles)

### **Min 3-5: Gestión de Usuarios**
- URL: `http://localhost:5173/app/usuarios`
- Mostrar listado con filtros
- **Demo**: Crear usuario rápido (sin guardar)

### **Min 5-7: Cursos y Materias**
- URL: `http://localhost:5173/app/gestion-cursos-materias`
- Mostrar asignaciones docente-curso-materia
- Explicar estructura de datos

### **Min 7-10: Calificaciones (Core)**
- URL: `http://localhost:5173/app/calificaciones`
- **Demo**: Cargar nota individual en tabla
- Mostrar cálculo automático de promedios
- Navegar a detalles del curso

### **Min 10-12: Asistencias**
- URL: `http://localhost:5173/app/asistencias`
- **Demo**: Marcar asistencia del día
- Mostrar calendario visual
- Explicar registro por materia

### **Min 12-14: Boletines y Reportes**
- URL: `http://localhost:5173/app/boletines`
- Generar boletín de curso
- Mostrar PDF generado
- Explicar observaciones automáticas

### **Min 14-15: Alertas y Cierre**
- URL: `http://localhost:5173/app/alertas`
- Mostrar alertas automáticas generadas
- **Demo**: Crear alerta manual rápida
- Resumen de funcionalidades

## 🔗 URLs Directas para Demo

- **Login**: `/login`
- **Dashboard**: `/app/dashboard`
- **Usuarios**: `/app/usuarios`
- **Cursos**: `/app/gestion-cursos-materias`
- **Calificaciones**: `/app/calificaciones`
- **Asistencias**: `/app/asistencias`
- **Boletines**: `/app/boletines`
- **Alertas**: `/app/alertas`
- **Reportes**: `/app/reportes`

## 📚 Documentación Completa

- **Setup**: `docs/INSTALLATION.md`
- **Variables**: `docs/ENVIRONMENT.md`
- **Módulos**: `docs/MODULE_MATRIX.md`
- **Datos**: `docs/DATA_MODEL.md`
- **Alertas**: `docs/AlertasAutomaticas.md`
- **Mensajería**: `docs/MessagingSystem.md`
- **Despliegue**: `docs/DEPLOYMENT.md`

## ⚠️ Troubleshooting Rápido

- **Build falla**: `pnpm run lint:fix`
- **Firestore error**: Verificar reglas en `firestore.rules`
- **Auth falla**: Revisar `.env.local` y Firebase console
- **Datos vacíos**: Ejecutar `pnpm run seed:demo`

## 🎯 KPIs de Demo

- **Tiempo login**: < 10s
- **Carga de nota**: < 20s  
- **Generación boletín**: < 60s
- **Registro asistencia**: < 30s
- **Navegación entre módulos**: < 5s 