// Configuración centralizada de la aplicación Drive Mentor

export const APP_CONFIG = {
  name: "Drive Mentor",
  shortName: "DM",
  tagline: "Tu mentor para el carnet de conducir",
  description: "Plataforma integral de preparación para el examen teórico del carnet de conducir",
  
  // Iconos y emojis de la aplicación
  icons: {
    main: "🚗",
    tests: "📝",
    study: "🎓", 
    stats: "📊",
    failures: "❌",
    notes: "📝",
    time: "⏱️",
    success: "✅",
    warning: "⚠️",
    info: "ℹ️"
  },
  
  // Paleta de colores centralizada
  colors: {
    // Colores principales basados en conducción/carretera
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe", 
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9", // Azul carretera principal
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e"
    },
    
    // Verde para éxito/aprobado
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0", 
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e", // Verde aprobado
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d"
    },
    
    // Rojo para fallos/errores
    danger: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5", 
      400: "#f87171",
      500: "#ef4444", // Rojo fallo
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d"
    },
    
    // Naranja para advertencias
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b", // Naranja advertencia
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f"
    },
    
    // Púrpura para estudio/educación
    study: {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7", // Púrpura estudio
      600: "#9333ea",
      700: "#7c3aed",
      800: "#6b21a8",
      900: "#581c87"
    },
    
    // Grises neutros
    neutral: {
      50: "#fafafa",
      100: "#f5f5f5",
      200: "#e5e5e5",
      300: "#d4d4d4",
      400: "#a3a3a3",
      500: "#737373",
      600: "#525252",
      700: "#404040",
      800: "#262626",
      900: "#171717"
    }
  },
  
  // Gradientes predefinidos
  gradients: {
    primary: "from-blue-500 to-blue-600",
    success: "from-green-500 to-green-600", 
    danger: "from-red-500 to-red-600",
    warning: "from-orange-500 to-orange-600",
    study: "from-purple-500 to-purple-600",
    hero: "from-blue-600 via-blue-700 to-blue-800",
    studyHero: "from-purple-500 to-indigo-600"
  },
  
  // Rutas de la aplicación
  routes: {
    home: "/",
    tests: "/",
    study: "/estudio",
    stats: "/stats", 
    failures: "/fallos",
    login: "/login",
    logout: "/logout"
  },
  
  // Configuración de funcionalidades
  features: {
    timeTracking: true,
    studyNotes: true,
    autoSave: true,
    analytics: true,
    failureReview: true
  }
};

// Utilidades para usar los colores
export const getColor = (category: keyof typeof APP_CONFIG.colors, shade: number = 500) => {
  return APP_CONFIG.colors[category]?.[shade as keyof typeof APP_CONFIG.colors.primary] || APP_CONFIG.colors.neutral[500];
};

export const getGradient = (type: keyof typeof APP_CONFIG.gradients) => {
  return APP_CONFIG.gradients[type] || APP_CONFIG.gradients.primary;
};

export const getIcon = (type: keyof typeof APP_CONFIG.icons) => {
  return APP_CONFIG.icons[type] || APP_CONFIG.icons.main;
};