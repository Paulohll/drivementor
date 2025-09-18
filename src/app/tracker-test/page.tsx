"use client";
import { useEffect, useState } from 'react';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import app from '../../firebaseApp';
import { useAuth } from '../../AuthContext';

export default function TimeTrackerTest() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFirestoreConnection = async () => {
    if (!user) {
      addLog('❌ No hay usuario autenticado');
      return;
    }

    setLoading(true);
    addLog('🔄 Iniciando test de conexión a Firestore...');

    try {
      const db = getFirestore(app);
      const testDocRef = doc(db, 'user_stats', user.uid);

      // Test 1: Leer documento existente
      addLog('📖 Test 1: Leyendo documento...');
      const docSnapshot = await getDoc(testDocRef);
      
      if (docSnapshot.exists()) {
        addLog('✅ Documento existe:');
        addLog(JSON.stringify(docSnapshot.data(), null, 2));
      } else {
        addLog('📝 Documento no existe, creando uno nuevo...');
        
        // Test 2: Crear documento
        const initialData = {
          totalTime: 10,
          dailyTime: 5,
          lastActiveDate: new Date().toISOString().split('T')[0],
          sessionsCount: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(testDocRef, initialData);
        addLog('✅ Documento creado exitosamente');
      }

      // Test 3: Actualizar documento
      addLog('📝 Test 3: Actualizando documento...');
      await updateDoc(testDocRef, {
        totalTime: 25,
        dailyTime: 15,
        updatedAt: serverTimestamp()
      });
      addLog('✅ Documento actualizado exitosamente');

      // Test 4: Verificar actualización
      addLog('🔍 Test 4: Verificando actualización...');
      const updatedSnapshot = await getDoc(testDocRef);
      if (updatedSnapshot.exists()) {
        addLog('✅ Datos actualizados:');
        addLog(JSON.stringify(updatedSnapshot.data(), null, 2));
      }

      addLog('🎉 Todos los tests pasaron exitosamente!');

    } catch (error) {
      addLog(`❌ Error en el test: ${error}`);
      console.error('Error completo:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test del Time Tracker</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={testFirestoreConnection}
            disabled={loading || !user}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ejecutando...' : 'Test Firestore'}
          </button>
          
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Limpiar Logs
          </button>
        </div>

        {!user && (
          <div className="text-red-600 mb-4">
            ⚠️ Debes estar autenticado para ejecutar los tests
          </div>
        )}

        <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
          <h3 className="font-semibold mb-2">Logs de Ejecución:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No hay logs todavía...</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}