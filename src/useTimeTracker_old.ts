import { useEffect, useState, useRef } from 'react';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import app from './firebaseApp';
import type { User } from 'firebase/auth';

interface TimeStats {
  totalTime: number; // Total en segundos
  dailyTime: number; // Tiempo del día actual en segundos
  lastActiveDate: string; // Fecha en formato YYYY-MM-DD
  sessionsCount: number; // Número total de sesiones
  lastSessionStart: number; // Timestamp de inicio de sesión actual
}

interface UseTimeTrackerReturn {
  totalTime: number;
  dailyTime: number;
  sessionsCount: number;
  isTracking: boolean;
  startSession: () => void;
  endSession: () => void;
  formatTime: (seconds: number) => string;
}

const UPDATE_INTERVAL = 10000; // Actualizar cada 10 segundos
let globalTrackingInstance: string | null = null; // Variable global para evitar múltiples trackers

export function useTimeTracker(user: User | null): UseTimeTrackerReturn {
  const [stats, setStats] = useState<TimeStats>({
    totalTime: 0,
    dailyTime: 0,
    lastActiveDate: '',
    sessionsCount: 0,
    lastSessionStart: 0
  });
  
  const [isTracking, setIsTracking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const [debugMode] = useState(false); // Debug desactivado para pruebas limpias
  const instanceId = useRef<string>(Math.random().toString(36).substr(2, 9)); // ID único para esta instancia

  // Log de debug
  const debugLog = (message: string, data?: any) => {
    if (debugMode) {
      console.log(`🔧 TimeTracker[${instanceId.current}]: ${message}`, data || '');
    }
  };

  // Cargar datos iniciales del usuario
  useEffect(() => {
    if (!user) {
      debugLog('Usuario no disponible, saltando carga de stats');
      return;
    }
    
    debugLog('Iniciando carga de stats para usuario', user.uid);
    
    async function loadUserStats() {
      try {
        const db = getFirestore(app);
        const userStatsRef = doc(db, 'user_stats', user!.uid);
        
        debugLog('Consultando documento de stats...');
        const userStatsDoc = await getDoc(userStatsRef);
        
        if (userStatsDoc.exists()) {
          const data = userStatsDoc.data();
          const today = new Date().toISOString().split('T')[0];
          
          debugLog('Datos existentes encontrados:', data);
          
          // Si es un nuevo día, resetear dailyTime
          const dailyTime = data.lastActiveDate === today ? data.dailyTime || 0 : 0;
          
          const loadedStats = {
            totalTime: data.totalTime || 0,
            dailyTime: dailyTime,
            lastActiveDate: data.lastActiveDate || today,
            sessionsCount: data.sessionsCount || 0,
            lastSessionStart: 0
          };
          
          debugLog('Stats cargadas:', loadedStats);
          setStats(loadedStats);
        } else {
          // Crear documento inicial
          const today = new Date().toISOString().split('T')[0];
          const initialStats = {
            totalTime: 0,
            dailyTime: 0,
            lastActiveDate: today,
            sessionsCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          debugLog('Creando documento inicial:', initialStats);
          await setDoc(userStatsRef, initialStats);
          
          setStats({
            totalTime: 0,
            dailyTime: 0,
            lastActiveDate: today,
            sessionsCount: 0,
            lastSessionStart: 0
          });
          
          debugLog('Documento inicial creado exitosamente');
        }
      } catch (error) {
        console.error('❌ Error loading user stats:', error);
        debugLog('Error en carga de stats:', error);
      }
    }
    
    loadUserStats();
  }, [user]);

  // Función para guardar stats en Firestore
  const saveStats = async (updatedStats: TimeStats) => {
    if (!user) {
      debugLog('No se puede guardar - usuario no disponible');
      return;
    }
    
    try {
      const db = getFirestore(app);
      const userStatsRef = doc(db, 'user_stats', user.uid);
      
      const dataToSave = {
        totalTime: updatedStats.totalTime,
        dailyTime: updatedStats.dailyTime,
        lastActiveDate: updatedStats.lastActiveDate,
        sessionsCount: updatedStats.sessionsCount,
        updatedAt: serverTimestamp()
      };
      
      debugLog('Guardando en Firestore:', dataToSave);
      
      await updateDoc(userStatsRef, dataToSave);
      
      debugLog('✅ Stats guardadas exitosamente en Firestore');
    } catch (error) {
      console.error('❌ Error saving stats:', error);
      debugLog('Error al guardar stats:', error);
    }
  };

  // Función para actualizar tiempo durante la sesión
  const updateTime = () => {
    if (!isTracking || startTimeRef.current === 0) {
      debugLog('No actualizando tiempo - tracking inactivo o sin inicio');
      return;
    }
    
    const now = Date.now();
    const sessionTime = Math.floor((now - startTimeRef.current) / 1000);
    const today = new Date().toISOString().split('T')[0];
    
    debugLog(`Actualizando tiempo - sessionTime: ${sessionTime}s`);
    
    setStats(prevStats => {
      const newDailyTime = prevStats.lastActiveDate === today 
        ? prevStats.dailyTime + sessionTime 
        : sessionTime; // Nuevo día
      
      const newStats = {
        ...prevStats,
        totalTime: prevStats.totalTime + sessionTime,
        dailyTime: newDailyTime,
        lastActiveDate: today
      };
      
      debugLog('Nuevas stats calculadas:', newStats);
      
      // Guardar en Firestore
      saveStats(newStats);
      
      return newStats;
    });
    
    // Resetear el contador para el próximo intervalo
    startTimeRef.current = now;
  };

  const startSession = () => {
    if (isTracking) {
      debugLog('Sesión ya activa, ignorando startSession');
      return;
    }
    
    // Verificar si ya hay otra instancia trackeando
    if (globalTrackingInstance && globalTrackingInstance !== instanceId.current) {
      debugLog(`Otra instancia ya está trackeando: ${globalTrackingInstance}, ignorando start`);
      return;
    }
    
    debugLog('⏱️ Iniciando sesión de tracking');
    setIsTracking(true);
    startTimeRef.current = Date.now();
    globalTrackingInstance = instanceId.current;
    
    // Actualizar stats de sesión
    setStats(prevStats => {
      const newStats = {
        ...prevStats,
        sessionsCount: prevStats.sessionsCount + 1,
        lastSessionStart: Date.now()
      };
      debugLog('Stats de nueva sesión:', newStats);
      return newStats;
    });
    
    // Iniciar intervalo de actualización
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      debugLog('⏰ Ejecutando updateTime por intervalo');
      updateTime();
    }, UPDATE_INTERVAL);
    
    debugLog(`Intervalo configurado cada ${UPDATE_INTERVAL/1000} segundos`);
  };

  const endSession = () => {
    if (!isTracking) {
      debugLog('No hay sesión activa para finalizar');
      return;
    }
    
    // Solo permitir que la instancia activa termine la sesión
    if (globalTrackingInstance !== instanceId.current) {
      debugLog(`Esta instancia ${instanceId.current} no es la activa ${globalTrackingInstance}, ignorando end`);
      return;
    }
    
    debugLog('⏹️ Finalizando sesión de tracking');
    
    // Actualizar una última vez antes de parar
    updateTime();
    
    setIsTracking(false);
    startTimeRef.current = 0;
    globalTrackingInstance = null;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    debugLog('Sesión finalizada correctamente');
  };

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start/stop basado en visibilidad de la página - SIMPLIFICADO
  useEffect(() => {
    debugLog('Configurando auto-start/stop para usuario:', user?.uid);
    
    // Solo auto-start si no hay tracking global activo
    if (user && !globalTrackingInstance) {
      debugLog('Usuario disponible y no hay tracking global - iniciando auto-start en 1 segundo...');
      const timer = setTimeout(() => {
        debugLog('Ejecutando auto-start diferido');
        startSession();
      }, 1000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [user]); // Removido isTracking para evitar loops

  // Configurar eventos de visibilidad por separado
  useEffect(() => {
    const handleVisibilityChange = () => {
      debugLog(`Visibilidad cambió - hidden: ${document.hidden}`);
      if (document.hidden) {
        debugLog('Página oculta - finalizando sesión');
        if (globalTrackingInstance === instanceId.current) {
          endSession();
        }
      } else if (user && !globalTrackingInstance) {
        debugLog('Página visible y usuario disponible - iniciando sesión');
        startSession();
      }
    };

    const handleBeforeUnload = () => {
      debugLog('Página cerrándose - finalizando sesión');
      if (globalTrackingInstance === instanceId.current) {
        endSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      debugLog('Limpiando event listeners');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Limpiar tracking global si esta instancia se desmonta
      if (globalTrackingInstance === instanceId.current) {
        globalTrackingInstance = null;
      }
    };
  }, [user]);

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
    totalTime: stats.totalTime,
    dailyTime: stats.dailyTime,
    sessionsCount: stats.sessionsCount,
    isTracking,
    startSession,
    endSession,
    formatTime
  };
}