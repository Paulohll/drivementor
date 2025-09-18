"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import app from "../../../firebaseApp";
import { useRouter } from "next/navigation";
import { subscribeToAuthChanges } from "../../../firebaseAuth";
import type { User } from "firebase/auth";
import type { StudyNote, StudySession } from "../../../useStudyNotes";

interface MaterialNotes {
  materialId: string;
  materialTitle: string;
  notes: StudyNote[];
  totalStudyTime: number;
  lastAccessed: Date;
}

export default function MisNotas() {
  const [user, setUser] = useState<User | null>(null);
  const [materialNotes, setMaterialNotes] = useState<MaterialNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const MATERIAL_TITLES = {
    "resumen-teoria": "📄 Resumen Teórico Completo",
    "videos-teoria": "🎥 Videos Explicativos",
    "flashcards": "🎯 Flashcards Interactivas"
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u: User | null) => {
      if (!u) {
        router.replace("/login");
      } else {
        setUser(u);
      }
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!user) return;

    async function loadAllNotes() {
      try {
        const db = getFirestore(app);
        const sessionsRef = collection(db, "study_sessions");
        const q = query(sessionsRef, where("userId", "==", user!.uid));
        const snapshot = await getDocs(q);

        const allMaterialNotes: MaterialNotes[] = [];

        snapshot.forEach(doc => {
          const data = doc.data() as StudySession;
          if (data.notes && data.notes.length > 0) {
            // Convertir timestamps a Date objects
            const notesWithDates = data.notes.map(note => ({
              ...note,
              timestamp: note.timestamp instanceof Date ? note.timestamp : new Date(note.timestamp)
            }));

            allMaterialNotes.push({
              materialId: data.materialId,
              materialTitle: MATERIAL_TITLES[data.materialId as keyof typeof MATERIAL_TITLES] || data.materialId,
              notes: notesWithDates,
              totalStudyTime: data.totalStudyTime || 0,
              lastAccessed: data.lastAccessed instanceof Date ? data.lastAccessed : new Date(data.lastAccessed)
            });
          }
        });

        // Ordenar por última actividad
        allMaterialNotes.sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime());
        setMaterialNotes(allMaterialNotes);
      } catch (error) {
        console.error("Error loading all notes:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAllNotes();
  }, [user]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours < 1) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const filteredMaterials = materialNotes.filter(material =>
    searchTerm === "" || 
    material.materialTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.notes.some(note => note.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalNotes = materialNotes.reduce((sum, material) => sum + material.notes.length, 0);
  const totalStudyTime = materialNotes.reduce((sum, material) => sum + material.totalStudyTime, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tus notas de estudio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
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
              <h1 className="text-3xl font-bold text-gray-800">📝 Mis Notas de Estudio</h1>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📝</div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total de Notas</p>
                  <p className="text-2xl font-bold text-purple-800">{totalNotes}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📚</div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Materiales Estudiados</p>
                  <p className="text-2xl font-bold text-blue-800">{materialNotes.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⏱️</div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Tiempo Total de Estudio</p>
                  <p className="text-2xl font-bold text-green-800">{formatTime(totalStudyTime)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Buscador */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en tus notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-12 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            {totalNotes === 0 ? (
              <>
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Aún no tienes notas de estudio</h3>
                <p className="text-gray-500 mb-6">Comienza a estudiar y tomar apuntes para verlos aquí</p>
                <button
                  onClick={() => router.push('/estudio')}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  🎓 Ir a Estudiar
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron resultados</h3>
                <p className="text-gray-500">Intenta con otros términos de búsqueda</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredMaterials.map((material) => (
              <div key={material.materialId} className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header del material */}
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold mb-2">{material.materialTitle}</h2>
                      <div className="flex items-center gap-6 text-purple-100">
                        <span className="flex items-center gap-2">
                          📝 {material.notes.length} nota{material.notes.length > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-2">
                          ⏱️ {formatTime(material.totalStudyTime)} estudiado
                        </span>
                        <span className="flex items-center gap-2">
                          📅 {material.lastAccessed.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/estudio?material=${material.materialId}`)}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
                    >
                      📖 Continuar estudiando
                    </button>
                  </div>
                </div>

                {/* Notas del material */}
                <div className="p-6">
                  <div className="grid gap-4">
                    {material.notes.map((note) => (
                      <div key={note.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-500">
                            {note.timestamp.toLocaleDateString()} - {note.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}