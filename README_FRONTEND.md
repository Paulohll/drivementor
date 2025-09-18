# DriveMentor Frontend

Frontend de la aplicación DriveMentor desarrollado con Next.js 15, TypeScript y Tailwind CSS.

## Características

- **Framework**: Next.js 15.5.2 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS 4
- **Autenticación**: Firebase Auth
- **Base de datos**: Firestore
- **Despliegue**: Firebase App Hosting

## Estructura del Proyecto

```
src/
├── app/                    # App Router pages
│   ├── estudio/           # Páginas de estudio
│   ├── fallos/            # Páginas de fallos
│   ├── login/             # Página de login
│   ├── questions/         # Páginas de preguntas
│   └── stats/             # Página de estadísticas
├── components/            # Componentes reutilizables
└── config/               # Configuración de la app
```

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar producción localmente
npm start
```

## Configuración de Firebase

El proyecto requiere configuración de Firebase en `src/firebaseConfig.ts`. Las variables de entorno necesarias:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Despliegue

El proyecto está configurado para desplegarse automáticamente en Firebase App Hosting mediante `apphosting.yaml`.

## Características Principales

- **Responsive Design**: Optimizado para móviles y desktop
- **Time Tracking**: Sistema de seguimiento de tiempo de estudio
- **Study Notes**: Sistema de notas de estudio
- **Test Management**: Gestión de tests y fallos
- **Progressive Web App**: Configurado como PWA