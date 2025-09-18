"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import app from "../../firebaseApp";
import { useRouter } from "next/navigation";
import { useAuth } from "../../AuthContext";
import { useTimeTracker } from "../../useTimeTracker";

interface TestSummary {
  testId: string;
  testDescription: string;
  count: number;
  lastResult: number;
  lastTotal: number;
}

interface TimeStats {
  totalTime: number;
  dailyTime: number;
  sessionsCount: number;
  createdAt: any;
}

export default function Estadisticas() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TestSummary[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { formatTime } = useTimeTracker(user);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    async function fetchAllStats() {
      setLoading(true);
      const db = getFirestore(app);
      
      // Fetch test stats
      const attemptsRef = collection(db, "test_attempts");
      const testsRef = collection(db, "tests");
      const q = query(attemptsRef, where("userId", "==", user!.uid));
      const snapshot = await getDocs(q);
      const testsSnapshot = await getDocs(testsRef);
      
      // Crear mapa de tests con sus descripciones
      const testsMap: Record<string, string> = {};
      testsSnapshot.forEach(doc => {
        testsMap[doc.id] = doc.data().description || doc.id;
      });
      
      const summary: Record<string, {count: number, lastResult: number, lastTotal: number}> = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!summary[data.testId]) {
          summary[data.testId] = { count: 0, lastResult: 0, lastTotal: 0 };
        }
        summary[data.testId].count += 1;
        summary[data.testId].lastResult = data.correctas;
        summary[data.testId].lastTotal = data.total;
      });
      
      setStats(Object.entries(summary).map(([testId, v]) => ({ 
        testId, 
        testDescription: testsMap[testId] || testId,
        ...v 
      })));

      // Fetch time stats
      try {
        const userStatsRef = doc(db, 'user_stats', user!.uid);
        const userStatsDoc = await getDoc(userStatsRef);
        
        if (userStatsDoc.exists()) {
          setTimeStats(userStatsDoc.data() as TimeStats);
        }
      } catch (error) {
        console.error('Error fetching time stats:', error);
      }
      
      setLoading(false);
    }

    fetchAllStats();
  }, [user, router]);

  const getAverageSessionTime = () => {
    if (!timeStats || timeStats.sessionsCount === 0) return 0;
    return timeStats.totalTime / timeStats.sessionsCount;
  };

  const getDaysSinceStart = () => {
    if (!timeStats?.createdAt) return 0;
    const createdDate = timeStats.createdAt.toDate ? timeStats.createdAt.toDate() : new Date(timeStats.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Estadísticas</h1>
      
      {/* Time Statistics - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">Tiempo Total</p>
              <p className="text-lg sm:text-2xl font-bold">{formatTime(timeStats?.totalTime || 0)}</p>
            </div>
            <div className="text-2xl sm:text-3xl">⏱️</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs sm:text-sm">Hoy</p>
              <p className="text-lg sm:text-2xl font-bold">{formatTime(timeStats?.dailyTime || 0)}</p>
            </div>
            <div className="text-2xl sm:text-3xl">📅</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs sm:text-sm">Sesiones</p>
              <p className="text-lg sm:text-2xl font-bold">{timeStats?.sessionsCount || 0}</p>
            </div>
            <div className="text-2xl sm:text-3xl">🎯</div>
          </div>
        </div>
      </div>

      {/* Additional Time Metrics - Responsive */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Métricas de Tiempo</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
          <div className="flex justify-between py-2 border-b text-sm sm:text-base">
            <span className="text-gray-600">Promedio por sesión:</span>
            <span className="font-medium">{formatTime(getAverageSessionTime())}</span>
          </div>
          <div className="flex justify-between py-2 border-b text-sm sm:text-base">
            <span className="text-gray-600">Días activo:</span>
            <span className="font-medium">{getDaysSinceStart()}</span>
          </div>
          <div className="flex justify-between py-2 border-b text-sm sm:text-base">
            <span className="text-gray-600">Promedio diario:</span>
            <span className="font-medium">
              {getDaysSinceStart() > 0 ? formatTime(Math.floor((timeStats?.totalTime || 0) / getDaysSinceStart())) : '0s'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b text-sm sm:text-base">
            <span className="text-gray-600">Tests realizados:</span>
            <span className="font-medium">{stats.reduce((acc, stat) => acc + stat.count, 0)}</span>
          </div>
        </div>
      </div>

      {/* Test Statistics - Responsive Table */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Estadísticas de Tests</h2>
        {loading ? (
          <p className="text-gray-600">Cargando estadísticas...</p>
        ) : stats.length === 0 ? (
          <p className="text-gray-600">No has realizado ningún test aún.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm sm:text-base">
              <thead>
                <tr>
                  <th className="py-2 px-2 sm:px-4 border-b">Test</th>
                  <th className="py-2 px-2 sm:px-4 border-b hidden sm:table-cell">Veces</th>
                  <th className="py-2 px-2 sm:px-4 border-b">Resultado</th>
                  <th className="py-2 px-2 sm:px-4 border-b">%</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(stat => (
                  <tr key={stat.testId}>
                    <td className="py-2 px-2 sm:px-4 border-b">
                      <div className="truncate max-w-[150px] sm:max-w-none">{stat.testDescription}</div>
                      <div className="text-xs text-gray-500 sm:hidden">{stat.count} veces</div>
                    </td>
                    <td className="py-2 px-2 sm:px-4 border-b hidden sm:table-cell">{stat.count}</td>
                    <td className="py-2 px-2 sm:px-4 border-b text-xs sm:text-sm">{stat.lastResult}/{stat.lastTotal}</td>
                    <td className="py-2 px-2 sm:px-4 border-b">
                      <div className="flex items-center">
                        <span className="mr-1 sm:mr-2 text-xs sm:text-sm">{Math.round((stat.lastResult / stat.lastTotal) * 100)}%</span>
                        <div className="w-12 sm:w-20 bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div 
                            className="bg-blue-600 h-1.5 sm:h-2 rounded-full" 
                            style={{ width: `${(stat.lastResult / stat.lastTotal) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
