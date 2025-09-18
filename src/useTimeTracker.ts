import { useEffect, useState, useRef } from 'react';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import app from './firebaseApp';
import type { User } from 'firebase/auth';

interface UseTimeTrackerReturn {
  totalTime: number;
  isTracking: boolean;
  formatTime: (seconds: number) => string;
}

export function useTimeTracker(user: User | null): UseTimeTrackerReturn {
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isTracking, setIsTracking] = useState(false);
  
  // Referencias para el tracking
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);

  // Cargar tiempo inicial desde Firebase
  useEffect(() => {
    if (!user) return;
    
    async function loadTotalTime() {
      try {
        const db = getFirestore(app);
        const userStatsRef = doc(db, 'user_stats', user!.uid);
        
        const userStatsDoc = await getDoc(userStatsRef);
        
        if (userStatsDoc.exists()) {
          const data = userStatsDoc.data();
          const savedTime = data.totalTime || 0;
          setTotalTime(savedTime);
          console.log('⏱️ Tiempo cargado desde Firebase:', savedTime, 'segundos');
        } else {
          // Crear documento inicial
          const initialData = {
            totalTime: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await setDoc(userStatsRef, initialData);
          setTotalTime(0);
          console.log('📄 Documento inicial creado en Firebase');
        }
      } catch (error) {
        console.error('❌ Error cargando tiempo desde Firebase:', error);
      }
    }
    
    loadTotalTime();
  }, [user]);

  // Función para sincronizar con Firebase
  const syncWithFirebase = async (currentTotalTime: number) => {
    if (!user) return;
    
    try {
      const db = getFirestore(app);
      const userStatsRef = doc(db, 'user_stats', user.uid);
      
      await updateDoc(userStatsRef, {
        totalTime: currentTotalTime,
        updatedAt: serverTimestamp()
      });
      
      console.log('💾 Tiempo sincronizado con Firebase:', currentTotalTime, 'segundos');
    } catch (error) {
      console.error('❌ Error sincronizando con Firebase:', error);
    }
  };

  // Función para iniciar el tracking
  const startTracking = () => {
    if (isTracking || !user) return;
    
    console.log('▶️ Iniciando tracking de tiempo');
    setIsTracking(true);
    startTimeRef.current = Date.now();
    lastSyncTimeRef.current = Date.now();
    
    // Actualizar cada segundo localmente
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeElapsed = Math.floor((now - startTimeRef.current) / 1000);
      
      // Actualizar tiempo local
      setTotalTime(prevTime => {
        const newTotalTime = prevTime + 1;
        
        // Sincronizar con Firebase cada 30 segundos
        if (now - lastSyncTimeRef.current >= 30000) {
          syncWithFirebase(newTotalTime);
          lastSyncTimeRef.current = now;
        }
        
        return newTotalTime;
      });
      
      // Actualizar referencia de tiempo
      startTimeRef.current = now;
    }, 1000);
  };

  // Función para detener el tracking
  const stopTracking = () => {
    if (!isTracking) return;
    
    console.log('⏹️ Deteniendo tracking de tiempo');
    setIsTracking(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Sincronizar una última vez al parar
    if (user) {
      syncWithFirebase(totalTime);
    }
    
    startTimeRef.current = 0;
  };

  // Auto-start/stop basado en visibilidad de la página
  useEffect(() => {
    if (!user) return;
    
    // Auto-start cuando el usuario esté disponible y la página visible
    if (!document.hidden) {
      startTracking();
    }
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTracking();
      } else {
        startTracking();
      }
    };

    const handleBeforeUnload = () => {
      stopTracking();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopTracking();
    };
  }, [user, totalTime]); // Agregar totalTime como dependencia para las sincronizaciones

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours < 24) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  return {
    totalTime,
    isTracking,
    formatTime
  };
}