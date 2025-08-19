# 🚨 Solución para Error 404 en Producción

## ⚡ Solución Rápida

### 1. Primero, intenta limpiar y redesplegar:

```bash
# Opción 1: Redespliegue forzado
npm run deploy:hosting:force

# Opción 2: Limpiar caché y redesplegar
npm run clear:hosting-cache
npm run deploy:hosting
```

### 2. Si persiste, verifica la configuración:

```bash
# Verificar proyecto Firebase actual
firebase use

# Verificar configuración de hosting
firebase serve --only hosting

# Ver logs de hosting
firebase hosting:log
```

## 🔧 Cambios Realizados

### `firebase.json` - Configuración mejorada:
- ✅ Agregado `cleanUrls: true` para URLs limpias
- ✅ Agregado `trailingSlash: false` para consistencia
- ✅ Configuración de caché mejorada para `index.html`
- ✅ Headers de caché optimizados

### `.gitignore` - Archivos necesarios:
- ✅ Descomentado `firebase.json` y `.firebaserc` (necesarios en producción)
- ✅ Descomentado `firestore.indexes.json`

### `package.json` - Scripts adicionales:
- ✅ `deploy:hosting:force` - Despliegue forzado
- ✅ `clear:hosting-cache` - Limpiar caché de hosting

## 🐛 Causas Comunes del Error 404

1. **Caché del navegador/CDN** - Los archivos antiguos están en caché
2. **Configuración de rewrites incorrecta** - Ya corregida
3. **Archivos de configuración ignorados** - Ya corregida
4. **Problemas de propagación** - Puede tomar unos minutos

## 📋 Pasos de Resolución

### Paso 1: Redespliegue Inmediato
```bash
cd MVP
npm run deploy:hosting:force
```

### Paso 2: Verificar en Incógnito
- Abre una ventana de incógnito en tu navegador
- Navega a tu sitio y prueba hacer refresh en diferentes rutas

### Paso 3: Verificar Configuración Local
```bash
# Probar localmente después del build
npm run build:prod
npm run preview
# Abre http://localhost:4173 y prueba las rutas
```

### Paso 4: Verificar Estado de Firebase
```bash
# Ver información del proyecto
firebase projects:list

# Ver configuración de hosting
firebase hosting:channel:list
```

## 🚀 Comandos de Emergencia

Si nada funciona, estos comandos pueden ayudar:

```bash
# Limpiar completamente y redesplegar
rm -rf dist
rm -rf node_modules/.cache
npm run build:prod
firebase deploy --only hosting --force

# O en Windows PowerShell:
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force node_modules\.cache
npm run build:prod
firebase deploy --only hosting --force
```

## ✅ Verificación Post-Despliegue

1. **Prueba estas URLs directamente en el navegador:**
   - `https://tu-dominio.web.app/app/dashboard`
   - `https://tu-dominio.web.app/app/calificaciones`
   - `https://tu-dominio.web.app/app/usuarios`

2. **Haz refresh (F5) en cada una** - No debería dar 404

3. **Prueba en modo incógnito** para evitar problemas de caché

## 📞 Si Persiste el Problema

Si después de estos pasos sigue dando 404:

1. Verifica los logs de Firebase Console
2. Revisa la pestaña "Hosting" en Firebase Console
3. Asegúrate de que el dominio esté correctamente configurado
4. Contacta al soporte de Firebase si es necesario

---

**Nota:** Los cambios pueden tardar hasta 5-10 minutos en propagarse completamente.
