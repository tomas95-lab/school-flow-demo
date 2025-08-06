# 🚀 Guía de Instalación - SchoolFlow MVP

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **Git** - [Descargar aquí](https://git-scm.com/)
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)
- **Cuenta de Firebase** - [Crear cuenta](https://firebase.google.com/)

## 🔧 Instalación Paso a Paso

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/schoolflow-mvp.git
cd schoolflow-mvp
```

### Paso 2: Instalar Dependencias
```bash
npm install
```

### Paso 3: Configurar Firebase

#### 3.1 Crear Proyecto Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear proyecto"
3. Nombra tu proyecto (ej: "schoolflow-mvp")
4. Habilita Google Analytics (opcional)
5. Haz clic en "Crear proyecto"

#### 3.2 Configurar Authentication
1. En Firebase Console, ve a **Authentication**
2. Haz clic en "Comenzar"
3. En la pestaña **Sign-in method**, habilita:
   - **Email/password**
4. Opcional: Configura otros proveedores (Google, etc.)

#### 3.3 Configurar Firestore Database
1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en "Crear base de datos"
3. Selecciona **Modo de prueba** (por ahora)
4. Elige una ubicación cercana a tus usuarios

#### 3.4 Obtener Credenciales
1. Ve a **Configuración del proyecto** (ícono de engranaje)
2. En la pestaña **General**, busca "Tus aplicaciones"
3. Haz clic en "Agregar aplicación" → **Web** (ícono </>)
4. Registra tu app con un nombre
5. **NO** configures Firebase Hosting por ahora
6. Copia la configuración de Firebase

### Paso 4: Configurar Variables de Entorno

#### 4.1 Crear archivo .env.local
En la raíz del proyecto, crea un archivo `.env.local`:

```bash
# En Windows
copy .env.example .env.local

# En macOS/Linux
cp .env.example .env.local
```

#### 4.2 Completar las variables
Abre `.env.local` y completa con tus credenciales de Firebase:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=tu_app_id

# Environment
VITE_NODE_ENV=development
VITE_APP_NAME=SchoolFlow MVP

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_ERROR_REPORTING=false
```

### Paso 5: Configurar Reglas de Firestore

#### 5.1 Crear archivo de reglas
Crea el archivo `firestore.rules` en la raíz:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer y escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Estudiantes pueden leer sus propios datos
    match /students/{studentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource.data.email == request.auth.token.email || 
         request.auth.token.role == "admin" || 
         request.auth.token.role == "teacher");
    }
    
    // Cursos - acceso según rol
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == "admin" || 
         request.auth.token.role == "teacher");
    }
    
    // Calificaciones - acceso según rol
    match /grades/{gradeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == "admin" || 
         request.auth.token.role == "teacher");
    }
    
    // Asistencias - acceso según rol
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.role == "admin" || 
         request.auth.token.role == "teacher");
    }
  }
}
```

#### 5.2 Desplegar reglas
```bash
# Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# Login a Firebase
firebase login

# Inicializar proyecto (solo si es necesario)
firebase init firestore

# Desplegar reglas
firebase deploy --only firestore:rules
```

### Paso 6: Ejecutar la Aplicación

#### 6.1 Modo desarrollo
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

#### 6.2 Verificar instalación
1. Abre `http://localhost:3000`
2. Deberías ver la página de login
3. Crea una cuenta de prueba
4. Verifica que puedas acceder al dashboard

## 🧪 Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run build:prod   # Build optimizado para producción
npm run preview      # Preview del build

# Testing
npm test             # Ejecutar tests
npm run test:ui      # Tests con interfaz
npm run test:run     # Tests una sola vez
npm run test:coverage # Tests con cobertura

# Linting
npm run lint         # Verificar código
npm run lint:fix     # Corregir errores automáticamente

# Firebase
npm run firebase:login    # Login a Firebase
npm run deploy:rules      # Desplegar reglas de Firestore
npm run deploy:firestore  # Desplegar índices de Firestore

# Vercel
npm run vercel:deploy     # Deploy a Vercel
npm run vercel:dev        # Desarrollo con Vercel
```

## 🚨 Solución de Problemas

### Error: "Firebase not initialized"
**Causa**: Variables de entorno no configuradas correctamente.
**Solución**:
1. Verifica que `.env.local` existe
2. Verifica que las variables empiecen con `VITE_`
3. Reinicia el servidor de desarrollo

### Error: "Permission denied"
**Causa**: Reglas de Firestore muy restrictivas o usuario sin permisos.
**Solución**:
1. Verifica que las reglas de Firestore estén desplegadas
2. Asegúrate de estar autenticado
3. Verifica que tu usuario tenga el rol correcto

### Error: "Module not found"
**Causa**: Dependencias no instaladas o cache corrupto.
**Solución**:
```bash
# Limpiar cache y reinstalar
rm -rf node_modules package-lock.json
npm install

# O con npm cache
npm cache clean --force
npm install
```

### Error: Tests fallan
**Causa**: Configuración de testing incorrecta.
**Solución**:
```bash
# Verificar setup de tests
npm run test:run

# Si siguen fallando, reinstalar dependencias de testing
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom
```

### Error: Build falla
**Causa**: Errores de TypeScript o dependencias faltantes.
**Solución**:
```bash
# Verificar errores de TypeScript
npm run lint

# Build con más información
npm run build -- --verbose
```

## 📞 Soporte

### Recursos Útiles
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de React](https://react.dev/)
- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)

### Comandos de Diagnóstico
```bash
# Verificar versiones
node --version
npm --version
firebase --version

# Verificar configuración
npm run lint
npm run test:run
npm run build

# Ver logs detallados
npm run dev -- --verbose
```

## ✅ Checklist de Instalación

- [ ] Node.js 18+ instalado
- [ ] Git instalado
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Proyecto Firebase creado
- [ ] Authentication configurado
- [ ] Firestore configurado
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Reglas de Firestore desplegadas
- [ ] Aplicación ejecutándose (`npm run dev`)
- [ ] Tests pasando (`npm test`)
- [ ] Build exitoso (`npm run build`)

**¡Felicidades! SchoolFlow MVP está listo para usar! 🎉**

---

## 🚀 Próximos Pasos

1. **Configurar datos iniciales**: Crear usuarios, cursos y estudiantes de prueba
2. **Personalizar configuración**: Ajustar colores, logos, textos
3. **Configurar producción**: Variables de entorno de producción
4. **Deploy**: Desplegar a Vercel o Firebase Hosting

¡Ahora puedes comenzar a usar SchoolFlow MVP!