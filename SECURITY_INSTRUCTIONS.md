# 🔒 INSTRUCCIONES DE SEGURIDAD CRÍTICAS

## ⚠️ CLAVES EXPUESTAS - ACCIÓN REQUERIDA

### 🚨 **PASO 1: REGENERAR CLAVES INMEDIATAMENTE**

1. **Ve a Firebase Console**: https://console.firebase.google.com
2. **Selecciona proyecto**: chat-1f95b
3. **Ve a Settings** (⚙️) → **Project Settings**
4. **En "Your apps"** → **Web app settings**
5. **REGENERAR/RESET API Key** inmediatamente
6. **Copiar las NUEVAS credenciales**

### 🔧 **PASO 2: CONFIGURAR CORRECTAMENTE**

Crea un archivo `.env.local` en la raíz del proyecto con las NUEVAS credenciales:

```env
# 🔥 Firebase Configuration (NUEVAS CLAVES)
VITE_FIREBASE_API_KEY=tu_nueva_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=chat-1f95b.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chat-1f95b
VITE_FIREBASE_STORAGE_BUCKET=chat-1f95b.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=nueva_sender_id
VITE_FIREBASE_APP_ID=nueva_app_id

# Environment
VITE_NODE_ENV=development
VITE_APP_NAME=SchoolFlow MVP
```

### 🛡️ **PASO 3: VERIFICAR SEGURIDAD**

- ✅ `.env.local` está en `.gitignore`
- ✅ Las claves NO están hardcodeadas en el código
- ✅ Solo usar variables de entorno: `import.meta.env.VITE_*`

### 🚫 **NUNCA MÁS:**

- ❌ Poner claves reales en código fuente
- ❌ Compartir archivos .env en chat
- ❌ Hacer commit de credenciales
- ❌ Exponer claves en logs o consola

### ✅ **BUENAS PRÁCTICAS:**

- ✅ Usar solo variables de entorno
- ✅ Regenerar claves si se exponen
- ✅ Diferentes claves para dev/prod
- ✅ Revisar commits antes de push

## 🔄 **PRÓXIMOS PASOS SEGUROS:**

1. Regenera claves en Firebase Console
2. Crea `.env.local` con nuevas claves
3. Verifica que la app funcione: `npm run dev`
4. ¡NUNCA más expongas credenciales!

---

**🔒 La seguridad es CRÍTICA. Las claves expuestas pueden comprometer todo el proyecto.**