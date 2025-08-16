## Variables de entorno

Resumen ejecutivo: estas variables son necesarias para correr el MVP en desarrollo y producción. Ejemplo listo para copiar al final.

### Requeridas

- VITE_FIREBASE_API_KEY: API key del proyecto Firebase Web.
- VITE_FIREBASE_AUTH_DOMAIN: dominio de auth, p.ej. your_project.firebaseapp.com.
- VITE_FIREBASE_PROJECT_ID: ID del proyecto Firebase.
- VITE_FIREBASE_STORAGE_BUCKET: bucket de storage, p.ej. your_project.appspot.com.
- VITE_FIREBASE_MESSAGING_SENDER_ID: sender ID numérico.
- VITE_FIREBASE_APP_ID: app id de la web app.

### Opcionales / feature flags

- VITE_NODE_ENV: environment string, p.ej. development.
- VITE_APP_NAME: nombre visible de la app.
- VITE_API_URL: endpoint de API (no requerido para el MVP, se usa Firebase directo).
- VITE_FIREBASE_FUNCTIONS_URL: URL base de Cloud Functions si se invocan por HTTP.
- VITE_ENABLE_ANALYTICS: true/false para habilitar Firebase Analytics en producción.
- VITE_ENABLE_DEBUG_MODE: true/false para logs extra en desarrollo.
- VITE_ENABLE_ERROR_REPORTING: true/false si se integra un reporter externo.
- VITE_ENABLE_CACHE: true/false para caches locales en hooks/utilidades.
- VITE_CACHE_DURATION: duración en ms de caches locales.
- VITE_GOOGLE_ANALYTICS_ID: opcional si se usa GA.
- VITE_FIREBASE_MEASUREMENT_ID: opcional para analytics de Firebase Web.
- VITE_ENABLE_CSP: bandera informativa; CSP se configura fuera del front.
- VITE_ALLOWED_DOMAINS: lista separada por comas de orígenes permitidos.
- VITE_TEST_MODE: bandera para habilitar shortcuts en tests locales.
- VITE_MOCK_DATA: bandera para activar mocks locales.

### Variables para scripts/CI

- GOOGLE_APPLICATION_CREDENTIALS: ruta al JSON de service account para scripts admin (seeding, export, reconciliación). Necesaria para `scripts/seed-demo.js` y `scripts/seed-demo-data.ts`.

### Ejemplo de `.env.local`

```dotenv
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your_app_id

VITE_NODE_ENV=development
VITE_APP_NAME=SchoolFlow MVP

VITE_API_URL=http://localhost:5000
VITE_FIREBASE_FUNCTIONS_URL=https://your_region-your_project.cloudfunctions.net

VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_ERROR_REPORTING=false

VITE_ENABLE_CACHE=true
VITE_CACHE_DURATION=300000

VITE_GOOGLE_ANALYTICS_ID=
VITE_FIREBASE_MEASUREMENT_ID=

VITE_ENABLE_CSP=false
VITE_ALLOWED_DOMAINS=localhost,127.0.0.1

VITE_TEST_MODE=false
VITE_MOCK_DATA=false
```

## 🚨 Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"

**Síntoma**: Error de autenticación al cargar la app
**Causa**: API key incorrecta o mal configurada

**Solución**:
1. Verificar `VITE_FIREBASE_API_KEY` en `.env.local`
2. Confirmar que la key está en `Project Settings > General > Your apps > Web app`
3. Verificar que no hay espacios extra o caracteres ocultos
4. Reiniciar el servidor de desarrollo: `pnpm run dev`

### Error: "Firebase: Error (auth/unauthorized-domain)"

**Síntoma**: Error de dominio no autorizado
**Causa**: Dominio no está en la lista de dominios autorizados de Firebase

**Solución**:
1. Ir a `Firebase Console > Authentication > Settings > Authorized domains`
2. Agregar `localhost` para desarrollo
3. Agregar tu dominio de producción
4. Verificar `VITE_FIREBASE_AUTH_DOMAIN` coincide

### Error: "Firebase: Error (permission-denied)"

**Síntoma**: Operaciones CRUD fallan con "Permission denied"
**Causa**: Reglas de Firestore muy restrictivas o mal configuradas

**Solución**:
1. Verificar `firestore.rules` en el proyecto
2. Desplegar reglas actualizadas: `firebase deploy --only firestore:rules`
3. Verificar que las reglas permiten operaciones básicas para usuarios autenticados
4. Revisar logs en `Firebase Console > Firestore > Rules`

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Síntoma**: Errores de CORS en consola del navegador
**Causa**: Configuración de CORS en Firebase o servidor

**Solución**:
1. Verificar configuración de CORS en `firebase.json`
2. Si usas Cloud Functions, agregar headers CORS
3. Verificar `VITE_ALLOWED_DOMAINS` incluye tu dominio
4. Para desarrollo local, asegurar que `localhost` está permitido

### Error: "Firebase: Error (storage/unauthorized)"

**Síntoma**: No se pueden subir/descargar archivos (PDFs)
**Causa**: Reglas de Storage muy restrictivas

**Solución**:
1. Ir a `Firebase Console > Storage > Rules`
2. Verificar que las reglas permiten acceso autenticado
3. Reglas básicas para desarrollo:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Error: "Firebase: Error (app/no-app)"

**Síntoma**: App no se inicializa correctamente
**Causa**: Configuración de Firebase mal inicializada

**Solución**:
1. Verificar `src/firebaseConfig.ts`
2. Confirmar que todas las variables `VITE_FIREBASE_*` están definidas
3. Verificar que `firebase.initializeApp()` se ejecuta antes de usar Firebase
4. Revisar orden de imports en `main.tsx`

### Error: "Module not found: Can't resolve 'firebase'"

**Síntoma**: Error de build o importación
**Causa**: Dependencias de Firebase no instaladas

**Solución**:
1. Instalar dependencias: `pnpm install`
2. Verificar `package.json` incluye `firebase` y `firebase-admin`
3. Limpiar cache: `pnpm run clean-collections`
4. Reinstalar node_modules: `rm -rf node_modules && pnpm install`

### Error: "Firebase: Error (auth/user-not-found)"

**Síntoma**: Usuarios demo no pueden hacer login
**Causa**: Usuarios no creados o seed no ejecutado

**Solución**:
1. Ejecutar seed: `pnpm run seed:demo`
2. Verificar que usuarios existen en `Firebase Console > Authentication > Users`
3. Confirmar que `users/{uid}` existe en Firestore
4. Verificar que el rol está asignado correctamente

### Error: "Firebase: Error (firestore/unavailable)"

**Síntoma**: Firestore no responde o está lento
**Causa**: Problemas de conectividad o límites de Firebase

**Solución**:
1. Verificar conexión a internet
2. Revisar `Firebase Console > Usage` para límites
3. Verificar que el proyecto no está en modo "Spark" (gratuito) con límites
4. Si es problema de límites, considerar upgrade a plan de pago

### Error: "Build failed: TypeScript compilation error"

**Síntoma**: Build falla con errores de tipos
**Causa**: Errores de TypeScript o tipos de Firebase desactualizados

**Solución**:
1. Ejecutar typecheck: `pnpm run typecheck`
2. Verificar versiones de `@types/firebase` si aplica
3. Actualizar dependencias: `pnpm update`
4. Revisar tipos en `src/types/` y `src/firebaseConfig.ts`

---

## 🔗 Recursos Adicionales

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Rules](https://firebase.google.com/docs/storage/security)
- [Firebase Authentication](https://firebase.google.com/docs/auth)


