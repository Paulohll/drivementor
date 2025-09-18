import { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import app from './firebaseApp';
import type { User } from 'firebase/auth';

export interface StudyNote {
  id: string;
  content: string;
  timestamp: Date;
  page?: number;
  position?: { x: number; y: number };
  materialId: string;
}

export interface StudySession {
  userId: string;
  materialId: string;
  notes: StudyNote[];
  totalStudyTime: number;
  lastAccessed: Date;
  currentPage: number;
}

interface UseStudyNotesReturn {
  notes: StudyNote[];
  loading: boolean;
  saving: boolean;
  addNote: (content: string) => void;
  updateNote: (noteId: string, content: string) => void;
  deleteNote: (noteId: string) => void;
  clearAllNotes: () => void;
  saveSession: () => Promise<void>;
}

export function useStudyNotes(
  user: User | null, 
  materialId: string,
  studyTime: number = 0
): UseStudyNotesReturn {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar notas existentes
  useEffect(() => {
    if (!user || !materialId) return;

    async function loadNotes() {
      try {
        setLoading(true);
        const db = getFirestore(app);
        const sessionDoc = await getDoc(doc(db, "study_sessions", `${user!.uid}_${materialId}`));
        
        if (sessionDoc.exists()) {
          const data = sessionDoc.data() as StudySession;
          // Convertir timestamps de Firestore a Date objects con validación
          const notesWithDates = (data.notes || []).map(note => {
            let validTimestamp: Date;
            
            try {
              if (note.timestamp instanceof Date && !isNaN(note.timestamp.getTime())) {
                validTimestamp = note.timestamp;
              } else if (note.timestamp) {
                // Manejar Firestore Timestamp objects
                const timestamp = note.timestamp as any;
                if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                  validTimestamp = timestamp.toDate();
                } else if (timestamp.seconds) {
                  validTimestamp = new Date(timestamp.seconds * 1000);
                } else {
                  validTimestamp = new Date(note.timestamp);
                }
              } else {
                validTimestamp = new Date();
              }
              
              // Verificar que la fecha sea válida
              if (isNaN(validTimestamp.getTime())) {
                validTimestamp = new Date();
              }
            } catch (error) {
              console.warn(`Error processing timestamp for note ${note.id}:`, error);
              validTimestamp = new Date();
            }

            return {
              ...note,
              timestamp: validTimestamp
            };
          });
          setNotes(notesWithDates);
        }
      } catch (error) {
        console.error("Error loading study notes:", error);
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, [user, materialId]);

  // Función para guardar la sesión
  const saveSession = useCallback(async () => {
    if (!user || !materialId || saving) return;

    setSaving(true);
    try {
      const db = getFirestore(app);
      
      // Asegurar que todas las fechas en las notas sean válidas
      const validatedNotes = notes.map(note => {
        let validTimestamp: Date;
        
        try {
          // Si timestamp es una instancia de Date válida
          if (note.timestamp instanceof Date && !isNaN(note.timestamp.getTime())) {
            validTimestamp = note.timestamp;
          } 
          // Si timestamp es un string o timestamp válido
          else if (note.timestamp) {
            const dateFromTimestamp = new Date(note.timestamp);
            if (!isNaN(dateFromTimestamp.getTime())) {
              validTimestamp = dateFromTimestamp;
            } else {
              // Fallback: fecha actual
              validTimestamp = new Date();
            }
          } 
          // Fallback: fecha actual
          else {
            validTimestamp = new Date();
          }
        } catch (error) {
          console.warn(`Error validating timestamp for note ${note.id}:`, error);
          validTimestamp = new Date();
        }

        return {
          ...note,
          timestamp: validTimestamp
        };
      });

      const sessionData: StudySession = {
        userId: user.uid,
        materialId,
        notes: validatedNotes,
        totalStudyTime: studyTime,
        lastAccessed: new Date(),
        currentPage: 1
      };

      await setDoc(doc(db, "study_sessions", `${user.uid}_${materialId}`), sessionData);
      console.log(`📚 Sesión de estudio guardada: ${materialId}`);
    } catch (error) {
      console.error("Error saving study session:", error);
    } finally {
      setSaving(false);
    }
  }, [user, materialId, notes, studyTime, saving]);

  // Auto-guardar cada 30 segundos
  useEffect(() => {
    if (!user || notes.length === 0) return;

    const autoSaveInterval = setInterval(() => {
      saveSession();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [user, notes, saveSession]);

  // Agregar nueva nota
  const addNote = useCallback((content: string) => {
    if (!content.trim()) return;

    const newNote: StudyNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      timestamp: new Date(),
      materialId,
    };

    setNotes(prev => [newNote, ...prev]);
    
    // Guardar inmediatamente después de agregar
    setTimeout(() => saveSession(), 100);
  }, [materialId, saveSession]);

  // Actualizar nota existente
  const updateNote = useCallback((noteId: string, content: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, content: content.trim() }
        : note
    ));
    
    setTimeout(() => saveSession(), 100);
  }, [saveSession]);

  // Eliminar nota
  const deleteNote = useCallback((noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    setTimeout(() => saveSession(), 100);
  }, [saveSession]);

  // Limpiar todas las notas
  const clearAllNotes = useCallback(() => {
    setNotes([]);
    setTimeout(() => saveSession(), 100);
  }, [saveSession]);

  return {
    notes,
    loading,
    saving,
    addNote,
    updateNote,
    deleteNote,
    clearAllNotes,
    saveSession
  };
}