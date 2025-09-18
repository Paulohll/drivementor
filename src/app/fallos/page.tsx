"use client";
import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import app from "../../firebaseApp";
import { useRouter } from "next/navigation";
import { subscribeToAuthChanges } from "../../firebaseAuth";
import type { User } from "firebase/auth";

interface PreguntaFallada {
  preguntaCodigo: string;
  pregunta: string;
  opciones: any[];
  respuestaCorrecta: string;
  explicacion?: string;
  foto64?: string;
}

interface TestConFallos {
  testId: string;
  testDescription: string;
  preguntas: PreguntaFallada[];
}

export default function Fallos() {
  const [user, setUser] = useState<User|null>(null);
  const [testsConFallos, setTestsConFallos] = useState<TestConFallos[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const router = useRouter();

  const toggleTestExpansion = (testId: string) => {
    setExpandedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testId)) {
        newSet.delete(testId);
      } else {
        newSet.add(testId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u: User|null) => {
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
    async function fetchFallos() {
      setLoading(true);
      const db = getFirestore(app);
      
      console.log("🔍 Buscando fallos para userId:", user!.uid);
      
      // PASO 1: Obtener intentos del usuario y consolidar fallos
      const attemptsRef = collection(db, "test_attempts");
      const q = query(attemptsRef, where("userId", "==", user!.uid));
      const snapshot = await getDocs(q);
      
      console.log("📊 Documentos de intentos encontrados:", snapshot.size);
      
      // Consolidar fallos únicos agrupados por testId
      const falllosPorTest = new Map<string, Set<string>>();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log("📝 Procesando intento:", doc.id, data);
        
        if (data.fallos && Array.isArray(data.fallos) && data.testId) {
          if (!falllosPorTest.has(data.testId)) {
            falllosPorTest.set(data.testId, new Set());
          }
          
          // Agregar cada fallo al conjunto del test correspondiente
          data.fallos.forEach((fallo: any) => {
            falllosPorTest.get(data.testId)!.add(fallo.toString());
          });
        }
      });
      
      console.log("🎯 Fallos consolidados por test:");
      falllosPorTest.forEach((fallos, testId) => {
        console.log(`  Test ${testId}: ${Array.from(fallos).join(', ')}`);
      });
      
      // PASO 2: Para cada test, buscar solo las preguntas que necesitamos en sus subcolecciones
      const testsConFallosData: TestConFallos[] = [];
      
      for (const [testId, fallosSet] of falllosPorTest.entries()) {
        console.log(`\n🔍 Buscando preguntas para Test ${testId}...`);
        
        try {
          // Obtener información del test
          const testDocRef = doc(db, "tests", testId);
          const testDoc = await getDoc(testDocRef);
          const testDescription = testDoc.exists() ? (testDoc.data()?.description || `Test ${testId}`) : `Test ${testId}`;
          
          console.log(`📖 Test ${testId} - ${testDescription}`);
          
          const preguntasFalladas: PreguntaFallada[] = [];
          
          // Buscar cada pregunta específica en la subcolección del test
          for (const preguntaCodigo of fallosSet) {
            try {
              console.log(`  🔎 Buscando pregunta ${preguntaCodigo} en test ${testId}...`);
              
              // DEBUGGING: Verificar estructura de la subcolección
              const preguntasRef = collection(db, "tests", testId, "preguntas");
              console.log(`    📁 Ruta de subcolección: tests/${testId}/preguntas`);
              
              // Primero, obtener TODAS las preguntas de la subcolección para verificar
              const todasPreguntasSnapshot = await getDocs(preguntasRef);
              console.log(`    📊 Total preguntas en subcolección: ${todasPreguntasSnapshot.size}`);
              
              if (todasPreguntasSnapshot.size > 0) {
                console.log(`    🔍 Primeras 3 preguntas de la subcolección:`);
                todasPreguntasSnapshot.docs.slice(0, 3).forEach((doc, idx) => {
                  const data = doc.data();
                  console.log(`      ${idx + 1}. ID: ${doc.id}, preguntaCodigo: ${data.preguntaCodigo}, pregunta: ${data.pregunta?.substring(0, 40)}...`);
                });
                
                // Verificar si la pregunta específica está en todas las preguntas
                const preguntaEncontradaEnTodas = todasPreguntasSnapshot.docs.find(doc => 
                  doc.data().preguntaCodigo === preguntaCodigo || 
                  doc.data().preguntaCodigo === parseInt(preguntaCodigo) ||
                  doc.data().preguntaCodigo?.toString() === preguntaCodigo
                );
                
                if (preguntaEncontradaEnTodas) {
                  console.log(`    ✅ Pregunta ${preguntaCodigo} SÍ existe en la subcolección!`);
                  console.log(`    📝 Datos:`, preguntaEncontradaEnTodas.data());
                } else {
                  console.log(`    ❌ Pregunta ${preguntaCodigo} NO encontrada en ${todasPreguntasSnapshot.size} preguntas`);
                  console.log(`    🔍 Códigos disponibles:`, todasPreguntasSnapshot.docs.map(doc => doc.data().preguntaCodigo).slice(0, 10));
                }
              }
              
              // Intentar múltiples variaciones de la consulta
              console.log(`    🔄 Probando consultas variadas para pregunta ${preguntaCodigo}...`);
              
              // Consulta 1: Como string
              const preguntaQuery1 = query(preguntasRef, where("preguntaCodigo", "==", preguntaCodigo));
              const preguntaSnapshot1 = await getDocs(preguntaQuery1);
              console.log(`    📋 Consulta string "${preguntaCodigo}": ${preguntaSnapshot1.size} resultados`);
              
              // Consulta 2: Como número
              const preguntaQuery2 = query(preguntasRef, where("preguntaCodigo", "==", parseInt(preguntaCodigo)));
              const preguntaSnapshot2 = await getDocs(preguntaQuery2);
              console.log(`    📋 Consulta número ${parseInt(preguntaCodigo)}: ${preguntaSnapshot2.size} resultados`);
              
              let preguntaSnapshot = preguntaSnapshot1.size > 0 ? preguntaSnapshot1 : preguntaSnapshot2;
              
              if (!preguntaSnapshot.empty) {
                const preguntaData = preguntaSnapshot.docs[0].data();
                const opcionCorrecta = preguntaData.opciones?.find((op: any) => op.respuestaSN === -1);
                
                console.log(`    ✅ Encontrada: ${preguntaData.pregunta?.substring(0, 50)}...`);
                
                preguntasFalladas.push({
                  preguntaCodigo: preguntaCodigo,
                  pregunta: preguntaData.pregunta || "",
                  opciones: preguntaData.opciones || [],
                  respuestaCorrecta: opcionCorrecta?.respuesta || "",
                  explicacion: preguntaData.explicacion,
                  foto64: preguntaData.foto64
                });
              } else {
                console.log(`    ❌ No encontrada pregunta ${preguntaCodigo} en test ${testId} con ninguna variación`);
                
                // Fallback: buscar en la colección general de preguntas
                console.log(`    🔄 Buscando en colección general...`);
                const preguntasGeneralRef = collection(db, "preguntas");
                const preguntaGeneralQuery1 = query(preguntasGeneralRef, where("preguntaCodigo", "==", preguntaCodigo));
                const preguntaGeneralQuery2 = query(preguntasGeneralRef, where("preguntaCodigo", "==", parseInt(preguntaCodigo)));
                
                const preguntaGeneralSnapshot1 = await getDocs(preguntaGeneralQuery1);
                const preguntaGeneralSnapshot2 = await getDocs(preguntaGeneralQuery2);
                
                const preguntaGeneralSnapshot = preguntaGeneralSnapshot1.size > 0 ? preguntaGeneralSnapshot1 : preguntaGeneralSnapshot2;
                
                if (!preguntaGeneralSnapshot.empty) {
                  const preguntaData = preguntaGeneralSnapshot.docs[0].data();
                  const opcionCorrecta = preguntaData.opciones?.find((op: any) => op.respuestaSN === -1);
                  
                  console.log(`    🔄 Encontrada en colección general: ${preguntaData.pregunta?.substring(0, 50)}...`);
                  
                  preguntasFalladas.push({
                    preguntaCodigo: preguntaCodigo,
                    pregunta: preguntaData.pregunta || "",
                    opciones: preguntaData.opciones || [],
                    respuestaCorrecta: opcionCorrecta?.respuesta || "",
                    explicacion: preguntaData.explicacion,
                    foto64: preguntaData.foto64
                  });
                } else {
                  console.log(`    ❌ Pregunta ${preguntaCodigo} no encontrada ni en subcolección ni en colección general`);
                }
              }
            } catch (error) {
              console.error(`❌ Error al obtener pregunta ${preguntaCodigo}:`, error);
            }
          }
          
          if (preguntasFalladas.length > 0) {
            testsConFallosData.push({
              testId,
              testDescription,
              preguntas: preguntasFalladas
            });
            
            console.log(`📋 Test ${testId} agregado con ${preguntasFalladas.length} preguntas falladas`);
          }
          
        } catch (error) {
          console.error(`❌ Error al procesar test ${testId}:`, error);
        }
      }
      
      // PASO 3: Mostrar información consolidada
      console.log("\n🎉 RESUMEN FINAL:");
      console.log(`Total de tests con fallos: ${testsConFallosData.length}`);
      testsConFallosData.forEach(test => {
        console.log(`\n📝 ${test.testDescription}:`);
        console.log(`  - ID: ${test.testId}`);
        console.log(`  - Preguntas falladas: ${test.preguntas.length}`);
        test.preguntas.forEach(p => {
          console.log(`    • ${p.preguntaCodigo}: ${p.pregunta.substring(0, 60)}...`);
        });
      });
      
      // Ordenar tests por ID
      testsConFallosData.sort((a, b) => parseInt(a.testId) - parseInt(b.testId));
      
      setTestsConFallos(testsConFallosData);
      setLoading(false);
    }
    fetchFallos();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Preguntas Falladas</h1>
      <div className="bg-white rounded-lg shadow p-3 sm:p-6">
        {loading ? (
          <p className="text-gray-600">Cargando preguntas falladas...</p>
        ) : testsConFallos.length === 0 ? (
          <p className="text-gray-600">¡Excelente! No tienes preguntas falladas.</p>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
              <p className="text-gray-600 text-sm sm:text-base">
                Tienes fallos en {testsConFallos.length} test{testsConFallos.length > 1 ? 's' : ''}.
              </p>
              <a
                href="/fallos/todos"
                className="px-4 py-2 sm:px-6 sm:py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center gap-2 text-sm sm:text-base justify-center sm:justify-start"
              >
                🎯 <span className="hidden sm:inline">Repaso Consolidado</span><span className="sm:hidden">Repaso</span>
                <span className="text-xs bg-orange-700 px-2 py-1 rounded-full">
                  {testsConFallos.reduce((sum, test) => sum + test.preguntas.length, 0)} preguntas
                </span>
              </a>
            </div>
            {testsConFallos.map((test) => {
              const isExpanded = expandedTests.has(test.testId);
              return (
                <div key={test.testId} className="border rounded-lg bg-gray-50 overflow-hidden">
                  {/* Header compacto - siempre visible y responsive */}
                  <div className="p-3 sm:p-4 bg-white border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <button
                          onClick={() => toggleTestExpansion(test.testId)}
                          className="flex items-center gap-1 sm:gap-2 hover:bg-gray-50 p-1 sm:p-2 rounded-lg transition-colors"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <h2 className="text-base sm:text-lg font-bold text-blue-800">
                            <span className="hidden sm:inline">Test {test.testId} - {test.testDescription}</span>
                            <span className="sm:hidden">Test {test.testId}</span>
                          </h2>
                        </button>
                        <span className="bg-red-100 text-red-800 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                          {test.preguntas.length} <span className="hidden sm:inline">pregunta{test.preguntas.length > 1 ? 's' : ''} fallada{test.preguntas.length > 1 ? 's' : ''}</span>
                          <span className="sm:hidden">fallos</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3">
                        <a
                          href={`/fallos/${test.testId}`}
                          className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium"
                        >
                          📚 <span className="hidden sm:inline">Repasar fallos</span><span className="sm:hidden">Repasar</span>
                        </a>
                        <button
                          onClick={() => toggleTestExpansion(test.testId)}
                          className="px-2 py-2 sm:px-3 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs sm:text-sm"
                        >
                          {isExpanded ? 'Ocultar' : <span className="hidden sm:inline">Ver preguntas</span>}<span className="sm:hidden">{isExpanded ? 'Ocultar' : 'Ver'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contenido expandible responsive */}
                  <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-none' : 'max-h-0 overflow-hidden'}`}>
                    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
                      {test.preguntas.map((pregunta, index) => (
                        <div key={pregunta.preguntaCodigo} className="border rounded-lg p-3 sm:p-4 bg-white">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-3 sm:gap-4">
                            {/* Imagen si existe - responsive */}
                            {pregunta.foto64 && (
                              <div className="flex justify-center lg:block">
                                <img
                                  src={`data:image/jpeg;base64,${pregunta.foto64}`}
                                  alt="Pregunta"
                                  className="w-full max-w-xs lg:w-32 lg:h-32 object-cover rounded border"
                                  style={{ maxHeight: '200px' }}
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-1 sm:gap-0">
                                <h3 className="font-semibold text-base sm:text-lg">
                                  Pregunta {index + 1}
                                </h3>
                                <span className="text-xs sm:text-sm text-gray-500">{pregunta.preguntaCodigo}</span>
                              </div>
                              
                              <div className="mb-3 sm:mb-4 text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: pregunta.pregunta }} />
                              
                              {/* Opciones responsive */}
                              <div className="space-y-2 mb-3 sm:mb-4">
                                {pregunta.opciones.map((opcion: any) => {
                                  return (
                                    <div
                                      key={opcion.opcion}
                                      className="p-2 rounded border bg-gray-50 text-sm sm:text-base"
                                    >
                                      <span className="font-medium">{opcion.opcion}:</span>{' '}
                                      <span dangerouslySetInnerHTML={{ __html: opcion.respuesta }} />
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <div className="text-xs sm:text-sm text-gray-600 italic">
                                💡 Usa el modo repaso para ver las respuestas correctas
                              </div>
                              
                              {/* Explicación responsive */}
                              {pregunta.explicacion && (
                                <div className="bg-blue-50 p-2 sm:p-3 rounded border mt-3">
                                  <h4 className="font-medium text-blue-800 mb-1 sm:mb-2 text-sm sm:text-base">Explicación disponible:</h4>
                                  <div className="text-blue-600 text-xs sm:text-sm italic">
                                    Accede al modo repaso para ver la explicación completa
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}