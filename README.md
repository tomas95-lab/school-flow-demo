# Descripción del Proyecto SchoolFlow

Este proyecto es una plataforma web de gestión escolar llamada **SchoolFlow**, desarrollada con **React**, **TypeScript** y **Vite** como base de frontend. Utiliza **Firebase** (Firestore y Auth) como backend para almacenamiento de datos y autenticación de usuarios.

## ¿Qué funcionalidades tiene hasta ahora?

- **Autenticación de usuarios**: Login con Firebase Auth y gestión de roles (admin, docente, alumno).
- **Panel de Dashboard**: Muestra estadísticas clave (alumnos, docentes, cursos, alertas) y accesos rápidos según el rol del usuario.
- **Gestión de Calificaciones**: Panel para admins con KPIs, listado de cursos y acceso a detalles de calificaciones por curso y alumno.
- **Gestión de Asistencias**: Paneles diferenciados para admin, docente y alumno, con estadísticas, visualización y registro de asistencias.
- **Sidebar y Navegación**: Barra lateral dinámica con rutas protegidas y breadcrumbs.
- **Componentes reutilizables**: Cards, tablas, combobox, badges, modales, etc.
- **Visualización de datos**: Uso de tablas avanzadas con filtros, paginación y exportación.
- **Carga y visualización de cursos, materias, alumnos, docentes y asistencias** desde Firestore.

## ¿Qué tecnologías y librerías usamos?

- **React** + **TypeScript** (estructura de componentes, hooks, tipado estricto)
- **Vite** (entorno de desarrollo rápido)
- **Firebase** (Firestore para datos, Auth para usuarios)
- **React Router** (navegación SPA)
- **Lucide React** (iconos)
- **Tailwind CSS** (estilos utilitarios)
- **TanStack Table** (tablas avanzadas)
- **date-fns** (manejo de fechas)
- **Class Variance Authority** (para variantes de estilos)
- **Componentes UI personalizados** (cards, sidebar, popover, etc.)

## ¿Qué hace el sistema?

Permite a una institución educativa gestionar de manera centralizada:

- **Usuarios**: admins, docentes y alumnos, cada uno con su panel y permisos.
- **Cursos y Materias**: visualización y administración.
- **Calificaciones**: carga, visualización y análisis de notas por materia, alumno y curso.
- **Asistencias**: registro, visualización y análisis de asistencias, con alertas de riesgo.
- **Alertas y notificaciones**: panel de alertas generadas por IA (simulado).
- **Navegación moderna**: sidebar, breadcrumbs, cards y tablas interactivas.

## Estado actual

El MVP ya permite:

- Login y navegación segura por roles.
- Visualización y gestión de cursos, materias, alumnos, docentes, calificaciones y asistencias.
- Estadísticas y KPIs en tiempo real.
- Interfaz moderna y responsiva.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
