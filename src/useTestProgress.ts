import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import app from './firebaseApp';
import type { User } from 'firebase/auth';

interface TestProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface UseTestProgressReturn {
  progress: TestProgress;
  loading: boolean;
}

export function useTestProgress(user: User | null): UseTestProgressReturn {
  const [progress, setProgress] = useState<TestProgress>({
    completed: 0,
    total: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadTestProgress() {
      try {
        setLoading(true);
        const db = getFirestore(app);

        // Obtener total de tests disponibles
        const testsCollection = collection(db, 'tests');
        const testsSnapshot = await getDocs(testsCollection);
        const totalTests = testsSnapshot.size;

        // Obtener tests completados por el usuario desde test_attempts
        const userAttemptsCollection = collection(db, 'test_attempts');
        const userAttemptsQuery = query(
          userAttemptsCollection, 
          where('userId', '==', user!.uid)
        );
        const userAttemptsSnapshot = await getDocs(userAttemptsQuery);
        
        // Contar tests únicos completados (evitar duplicados)
        const completedTestIds = new Set<string>();
        userAttemptsSnapshot.forEach(doc => {
          const data = doc.data() as { testId?: string; userId?: string };
          if (data.testId) {
            completedTestIds.add(data.testId);
          }
        });
        
        const completedTests = completedTestIds.size;

        const percentage = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;

        setProgress({
          completed: completedTests,
          total: totalTests,
          percentage
        });

        console.log('📊 Progreso de tests cargado:', { 
          completedTests, 
          totalTests, 
          percentage,
          attemptsCount: userAttemptsSnapshot.size 
        });
      } catch (error) {
        console.error('❌ Error cargando progreso de tests:', error);
        setProgress({ completed: 0, total: 0, percentage: 0 });
      } finally {
        setLoading(false);
      }
    }

    loadTestProgress();
  }, [user]);

  return { progress, loading };
}

export default useTestProgress;