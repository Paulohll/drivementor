"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeToAuthChanges } from "../../firebaseAuth";
import type { User } from "firebase/auth";
import { useTimeTracker } from "../../useTimeTracker";
import { useStudyNotes } from "../../useStudyNotes";
import { APP_CONFIG } from "../../config/app";

const STUDY_MATERIALS = [
  {
    id: "resumen-teoria",
    title: `${APP_CONFIG.icons.study} Resumen Teórico Completo`,
    description: "Documento PDF con todo el contenido teórico del examen de conducir",
    type: "pdf",
    url: "https://drive.google.com/file/d/1Lc7lAIn35meMtsAd_nizchKRLYp1orJg/view?usp=sharing",
    embedUrl: "https://drive.google.com/file/d/1Lc7lAIn35meMtsAd_nizchKRLYp1orJg/preview",
    icon: APP_CONFIG.icons.study,
    color: APP_CONFIG.gradients.primary
  },
  {
    id: "videos-teoria",
    title: `🎥 Videos Explicativos`,
    description: "Próximamente: Videos con explicaciones detalladas del código de circulación",
    type: "video", 
    url: "#",
    embedUrl: "",
    icon: "🎥",
    color: APP_CONFIG.gradients.danger,
    comingSoon: true
  },
  {
    id: "simulacros",
    title: `${APP_CONFIG.icons.tests} Simulacros de Examen`,
    description: "Próximamente: Simulacros oficiales como en el examen real",
    type: "simulator",
    url: "#",
    embedUrl: "",
    icon: APP_CONFIG.icons.tests,
    color: APP_CONFIG.gradients.success,
    comingSoon: true
  }
];

export default function Estudio() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("resumen-teoria");
  const [newNote, setNewNote] = useState("");
  const [showNotes, setShowNotes] = useState(true);
  const router = useRouter();

  // Integrar hooks
  const { totalTime, isTracking, formatTime } = useTimeTracker(user);
  const { notes, loading, saving, addNote, deleteNote, clearAllNotes } = useStudyNotes(user, selectedMaterial, 0);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u: User | null) => {
      if (!u) {
        router.replace("/login");
      } else {
        setUser(u);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNote(newNote);
    setNewNote("");
  };

  const selectedMaterialData = STUDY_MATERIALS.find(m => m.id === selectedMaterial);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando material de estudio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con información de tracking */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Volver
              </button>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <span className="text-3xl">{APP_CONFIG.icons.main}</span>
                {APP_CONFIG.icons.study} Módulo de Estudio - {APP_CONFIG.name}
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Time Tracker Display */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-lg border border-blue-200">
                <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-blue-800">
                  {APP_CONFIG.icons.time} Tiempo total: {formatTime(totalTime)}
                </span>
              </div>
              
              {/* Auto-save indicator */}
              {saving && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Guardando...
                </div>
              )}
              
              {/* Toggle notes panel */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/estudio/mis-notas')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm shadow-md"
                >
                  {APP_CONFIG.icons.notes} Ver todas mis notas
                </button>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md"
                >
                  {APP_CONFIG.icons.notes} {showNotes ? 'Ocultar' : 'Mostrar'} Notas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Material Selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Selecciona el material de estudio:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STUDY_MATERIALS.map((material) => (
              <button
                key={material.id}
                onClick={() => !material.comingSoon && setSelectedMaterial(material.id)}
                className={`relative p-4 rounded-lg text-left transition-all ${
                  selectedMaterial === material.id 
                    ? `bg-gradient-to-r ${material.color} text-white shadow-lg` 
                    : 'bg-white hover:shadow-md border-2 border-transparent hover:border-purple-200'
                } ${material.comingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{material.icon}</span>
                  <h3 className="font-semibold">{material.title}</h3>
                </div>
                <p className={`text-sm ${selectedMaterial === material.id ? 'text-white/90' : 'text-gray-600'}`}>
                  {material.description}
                </p>
                {material.comingSoon && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
                    Próximamente
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Study Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Content Viewer */}
          <div className={`${showNotes ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white rounded-lg shadow-lg overflow-hidden`}>
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold flex items-center gap-2">
                {selectedMaterialData?.icon} {selectedMaterialData?.title}
              </h3>
            </div>
            
            <div className="h-[calc(100vh-300px)]">
              {selectedMaterialData?.embedUrl ? (
                <iframe
                  src={selectedMaterialData.embedUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="autoplay"
                  title={selectedMaterialData.title}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">{selectedMaterialData?.icon}</div>
                    <p className="text-lg mb-2">Material próximamente disponible</p>
                    <p className="text-sm">Estamos trabajando para traerte el mejor contenido</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Panel */}
          {showNotes && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-purple-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                    📝 Mis Notas
                    <span className="text-sm font-normal text-purple-600">({notes.length})</span>
                  </h3>
                  {notes.length > 0 && (
                    <button
                      onClick={clearAllNotes}
                      className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-300 hover:bg-red-50 transition-colors"
                    >
                      🗑️ Limpiar todo
                    </button>
                  )}
                </div>
                {saving && (
                  <div className="flex items-center gap-2 text-xs text-purple-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                    Guardando automáticamente...
                  </div>
                )}
              </div>
              
              {/* Add Note */}
              <div className="p-4 border-b">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Escribe tus notas aquí..."
                  className="w-full h-20 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAddNote();
                    }
                  }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="mt-2 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ➕ Agregar Nota
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Consejos: Ctrl + Enter para agregar | Las notas se guardan automáticamente cada 30s
                </p>
              </div>
              
              {/* Notes List */}
              <div className="h-[calc(100vh-500px)] overflow-y-auto">
                {notes.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="text-4xl mb-3">📝</div>
                    <h4 className="font-medium text-gray-700 mb-2">¡Comienza a tomar notas!</h4>
                    <p className="text-sm mb-4">Escribe tus apuntes mientras estudias el material</p>
                    <div className="bg-purple-50 p-3 rounded-lg text-xs text-purple-700">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <span>💡</span>
                        <span className="font-medium">Consejos útiles</span>
                      </div>
                      <div className="space-y-1">
                        <p>• Las notas se guardan automáticamente</p>
                        <p>• Usa Ctrl + Enter para agregar rápido</p>
                        <p>• El tiempo de estudio se rastrea automáticamente</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {notes.map((note) => (
                      <div key={note.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs text-gray-500">
                            {note.timestamp.toLocaleString()}
                          </span>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            ❌
                          </button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}