## 🎓 Módulo de Estudio - Documentación

### Funcionalidades Implementadas

#### 📚 **Visor de Documentos PDF**
- ✅ Integración directa con Google Drive
- ✅ Iframe embebido para visualización fluida
- ✅ URL del documento: `https://drive.google.com/file/d/1SpCX6PnP386tdW_hvyqPJTFaHpHkm7s3/view`

#### 📝 **Sistema de Notas Inteligente**
- ✅ Toma de notas en tiempo real
- ✅ Auto-guardado cada 30 segundos
- ✅ Persistencia en Firestore por usuario
- ✅ Timestamp automático
- ✅ Atajo de teclado (Ctrl + Enter)

#### ⏱️ **Tracking de Tiempo de Estudio**
- ✅ Auto-inicio al entrar a la página
- ✅ Integración con el sistema global de tiempo
- ✅ Visualización en tiempo real
- ✅ Contribuye a las estadísticas generales

#### 🎨 **Interfaz Responsiva**
- ✅ Layout adaptativo (3/4 para contenido, 1/4 para notas)
- ✅ Panel de notas ocultable
- ✅ Indicadores visuales de estado
- ✅ Diseño moderno con gradientes

### Estructura de Datos

#### `study_sessions` Collection
```typescript
interface StudySession {
  userId: string;
  notes: StudyNote[];
  totalStudyTime: number;
  lastAccessed: Date;
  currentPage: number;
}
```

#### `StudyNote` Interface
```typescript
interface StudyNote {
  id: string;
  content: string;
  timestamp: Date;
  page?: number;
  position?: { x: number; y: number };
}
```

### Expansiones Planificadas

#### 🎥 **Videos Explicativos** (Próximamente)
- Integración con YouTube/Vimeo
- Notas timestamped en videos
- Control de reproducción sincronizado

#### 🎯 **Flashcards Interactivas** (Próximamente)
- Sistema de repetición espaciada
- Generación automática desde notas
- Gamificación del aprendizaje

#### 📊 **Analytics de Estudio Avanzadas**
- Tiempo por tipo de material
- Patrones de estudio efectivos
- Recomendaciones personalizadas

### Configuración del PDF

Para cambiar el documento PDF, modificar en `STUDY_MATERIALS`:

```typescript
{
  id: "resumen-teoria",
  title: "📄 Resumen Teórico Completo",
  url: "https://drive.google.com/file/d/1SpCX6PnP386tdW_hvyqPJTFaHpHkm7s3/view",
  embedUrl: "https://drive.google.com/file/d/1SpCX6PnP386tdW_hvyqPJTFaHpHkm7s3/preview",
}
```

### Navegación

- **Acceso**: Botón "📖 Estudiar Teoría" en la página principal
- **Ruta**: `/estudio`
- **Integración**: Menú principal con tracking global

### Características Técnicas

- **Framework**: Next.js 14 con TypeScript
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Estilos**: Tailwind CSS
- **Auto-guardado**: Intervalo de 30 segundos
- **Responsive**: Mobile-first design