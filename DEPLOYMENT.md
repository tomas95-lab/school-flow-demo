# 🚀 Guía de Despliegue - SchoolFlow MVP

## 📋 Prerrequisitos

- Node.js 18+ instalado
- Firebase CLI instalado: `npm install -g firebase-tools`
- Cuenta de Firebase con proyecto creado
- Git configurado

## 🔧 Configuración Inicial

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Firebase
```bash
# Login a Firebase
npm run firebase:login

# Ver proyectos disponibles
npm run firebase:projects

# Usar proyecto específico (reemplaza con tu project ID)
firebase use chat-1f95b
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` con tus credenciales de Firebase:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=tu_app_id

# Environment
VITE_NODE_ENV=production
VITE_APP_NAME=SchoolFlow MVP

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_ERROR_REPORTING=true
```

## 🏗️ Build para Producción

### 1. Build Optimizado
```bash
npm run build:prod
```

### 2. Verificar Build
```bash
npm run preview
```

## 🚀 Despliegue

### Opción 1: Despliegue Completo
```bash
npm run deploy
```

### Opción 2: Despliegue por Partes

#### Solo Hosting
```bash
npm run deploy:hosting
```

#### Solo Firestore Rules
```bash
npm run deploy:rules
```

#### Solo Firestore
```bash
npm run deploy:firestore
```

## 🔒 Configuración de Seguridad

### 1. Verificar Reglas de Firestore
```bash
# Ver reglas actuales
firebase firestore:rules:get

# Desplegar reglas
firebase deploy --only firestore:rules
```

### 2. Configurar Autenticación
- Ir a Firebase Console > Authentication
- Habilitar proveedores necesarios (Email/Password)
- Configurar dominios autorizados

### 3. Configurar Hosting
```bash
# Ver configuración de hosting
firebase hosting:channel:list

# Crear canal de preview
firebase hosting:channel:deploy preview
```

## 📊 Monitoreo

### 1. Firebase Analytics
- Habilitar en Firebase Console
- Configurar eventos personalizados

### 2. Performance Monitoring
- Habilitar en Firebase Console
- Monitorear métricas de rendimiento

### 3. Error Reporting
- Habilitar en Firebase Console
- Configurar alertas

## 🔧 Troubleshooting

### Error: "Firebase not initialized"
- Verificar variables de entorno
- Asegurar que Firebase esté configurado correctamente

### Error: "Permission denied"
- Verificar reglas de Firestore
- Asegurar que el usuario tenga permisos

### Error: "Build failed"
- Verificar TypeScript errors: `npm run lint`
- Verificar dependencias: `npm install`

## 📈 Optimizaciones de Producción

### 1. Performance
- ✅ Bundle splitting configurado
- ✅ Minificación habilitada
- ✅ Cache headers configurados
- ✅ Lazy loading implementado

### 2. Security
- ✅ CSP headers configurados
- ✅ HTTPS habilitado
- ✅ XSS protection habilitado

### 3. Monitoring
- ✅ Error boundaries configurados
- ✅ Performance monitoring habilitado
- ✅ Analytics configurado

## 🔄 CI/CD (Opcional)

### GitHub Actions
```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build:prod
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: chat-1f95b
          channelId: live
```

## 📞 Soporte

### Comandos Útiles
```bash
# Ver logs de hosting
firebase hosting:log

# Ver logs de functions
firebase functions:log

# Ver estado del proyecto
firebase projects:list

# Cambiar proyecto
firebase use [project-id]
```

### Recursos
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://react.dev/)

---

## ✅ Checklist de Despliegue

- [ ] Variables de entorno configuradas
- [ ] Firebase CLI instalado y configurado
- [ ] Build de producción exitoso
- [ ] Reglas de Firestore desplegadas
- [ ] Hosting configurado
- [ ] Autenticación configurada
- [ ] Analytics habilitado
- [ ] Error reporting configurado
- [ ] Performance monitoring habilitado
- [ ] Tests pasando
- [ ] Documentación actualizada

**¡Tu aplicación está lista para producción! 🎉** 