"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeToAuthChanges } from "../../../firebaseAuth";
import type { User } from "firebase/auth";
import { useParams } from "next/navigation";
import { fetchTest, fetchPreguntas } from "../../../firestoreClient";
import { saveTestAttempt } from "../../../saveTestAttempt";

interface Resultados {
  mostrar: boolean;
  correctas: number;
  incorrectas: number;
  total: number;
}
export default function QuestionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user: User | null) => {
      if (!user) {
        router.replace('/login');
        setUser(null);
      } else {
        setUser(user);
      }
    });
    return unsubscribe;
  }, [router]);

  // Auto-iniciar tracking cuando el usuario está disponible
  // useEffect(() => {
  //   if (user) {
  //     startSession();
  //   }
  //   return () => {
  //     endSession();
  //   };
  // }, [user, startSession, endSession]);

  const params = useParams();
  const testId = typeof params.testId === "string" ? params.testId : Array.isArray(params.testId) ? params.testId[0] : "";
  const [test, setTest] = useState<any>(null);
  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<{ [key: string]: string }>({});
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<number>(0);
  const [resultados, setResultados] = useState<Resultados>({
    mostrar: false,
    correctas: 0,
    incorrectas: 0,
    total: 0
  });
  const [preguntaActual, setPreguntaActual] = useState<number>(0);
  const [mostrarIndice, setMostrarIndice] = useState<boolean>(false);

  const formatearTiempo = (totalSegundos: number): string => {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;

    const pad = (num: number): string => num.toString().padStart(2, '0');

    if (horas > 0) {
      return `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`;
    }
    return `${pad(minutos)}:${pad(segundos)}`;
  };

  // Efecto para manejar el temporizador
  useEffect(() => {
    if (!resultados.mostrar) {
      const intervalo = setInterval(() => {
        setTiempoTranscurrido(prev => prev + 1);
      }, 1000);

      return () => clearInterval(intervalo);
    }
  }, [resultados.mostrar]);

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    Promise.all([
      fetchTest(testId),
      fetchPreguntas(testId)
    ])
      .then(([testData, preguntasData]) => {
        setTest(testData);
        setPreguntas(preguntasData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[QuestionsPage] Error al cargar datos:", err);
        setError("Error al cargar datos del test");
        setLoading(false);
      });
  }, [testId]);

  function getGuestId() {
    let id = localStorage.getItem('guestUserId');
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('guestUserId', id);
    }
    return id;
  }

  const handleSubmit = async () => {
    // Verificar que todas las preguntas tengan respuesta
    const faltantes = preguntas.filter((preg, idx) => respuestas[`${preg.preguntaCodigo || idx}`] === undefined);
    if (faltantes.length > 0) {
      window.alert('Por favor responde todas las preguntas antes de enviar.');
      return;
    }

    // Calcular resultados y fallos
    let correctas = 0;
    let incorrectas = 0;
    const fallos: Array<string | number> = [];

    preguntas.forEach((preg, idx) => {
      const respuestaSeleccionada = respuestas[`${preg.preguntaCodigo || idx}`];
      const opcionCorrecta = preg.opciones.find((op: any) => op.respuestaSN === -1);
      if (opcionCorrecta && respuestaSeleccionada === opcionCorrecta.opcion) {
        correctas++;
      } else {
        incorrectas++;
        fallos.push(preg.preguntaCodigo || idx);
      }
    });

    setResultados({
      mostrar: true,
      correctas,
      incorrectas,
      total: preguntas.length
    });

    // Guardar intento en Firestore como invitado
    try {
      await saveTestAttempt({
        testId,
        userId: user && user.uid ? user.uid : getGuestId(),
        respuestas,
        correctas,
        incorrectas,
        total: preguntas.length,
        tiempo: tiempoTranscurrido,
        fecha: new Date(),
        fallos
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('No se pudo guardar el intento:', e);
    }

    // Scroll hasta el resumen de resultados
    const resultadosElement = document.getElementById('resultados-test');
    if (resultadosElement) {
      resultadosElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (user === undefined || loading) {
    return <div className="max-w-2xl mx-auto p-4"><h1 className="text-2xl font-bold mb-2">Test: {testId}</h1><div>Cargando usuario y preguntas...</div></div>;
  }
  if (user === null) {
    return null; // Redirige a login
  }
  if (error) {
    return <div className="max-w-2xl mx-auto p-4"><h1 className="text-2xl font-bold mb-2">Test: {testId}</h1><div>{error}</div></div>;
  }
  if (!test) {
    return <div className="max-w-2xl mx-auto p-4"><h1 className="text-2xl font-bold mb-2">Test: {testId}</h1><div>No se encontró el test.</div></div>;
  }
  if (!user) {
    window.alert('No se ha cargado el usuario. Por favor, recarga la página.');
    return;
  }
    // Convertir timestamp Firestore a fecha legible
  let fecha = "";
  if (test.timestamp && typeof test.timestamp === "object" && "seconds" in test.timestamp) {
    fecha = new Date(test.timestamp.seconds * 1000).toLocaleString();
  } else if (typeof test.timestamp === "string") {
    fecha = test.timestamp;
  }
  return (

    <div className="max-w-7xl mx-auto p-2 sm:p-4">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2 sm:gap-0">
        <button
          onClick={() => window.location.href = "/"}
          className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm sm:text-base order-2 sm:order-1"
        >
          ← Volver al listado de tests
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left order-1 sm:order-2">Test: {testId}</h1>
      </div>

    
      <div className="mb-4 text-gray-700">
        {typeof test.prefijo === "string" && (
          <div><strong>Prefijo:</strong> {test.prefijo}</div>
        )}
        {typeof test.num_preguntas === "number" && (
          <div><strong>Número de preguntas:</strong> {test.num_preguntas}</div>
        )}
        {fecha && (
          <div><strong>Fecha:</strong> {fecha}</div>
        )}
      </div>

      {preguntas.length === 0 ? (
        <div>No se encontraron preguntas.</div>
      ) : (
        <div className="relative">
          {/* Botón Anterior - Lateral izquierdo */}
          <button
            onClick={() => setPreguntaActual(prev => Math.max(0, prev - 1))}
            disabled={preguntaActual === 0}
            className="fixed left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-40 w-10 h-12 sm:w-12 sm:h-16 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center group"
            title="Pregunta anterior"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Botón Siguiente - Lateral derecho */}
          <button
            onClick={() => setPreguntaActual(prev => Math.min(preguntas.length - 1, prev + 1))}
            disabled={preguntaActual === preguntas.length - 1}
            className="fixed right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-40 w-10 h-12 sm:w-12 sm:h-16 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center group"
            title="Siguiente pregunta"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Contenido principal con padding lateral responsive */}
          <div className="px-4 sm:px-16 lg:px-20">
            {/* Pregunta actual */}
          {(() => {
            const preg = preguntas[preguntaActual];
            const idx = preguntaActual;
            return (
              <>
                <div key={preg.preguntaCodigo || idx} className="mt-2 mb-8 border-b pb-4">
                  {/* Imagen base64 si existe - Arriba en móvil, a la izquierda en pantallas más grandes */}
                  {typeof preg.foto64 === "string" && preg.foto64.length > 20 && (
                    <div className="mb-4 sm:mb-0 sm:float-left sm:mr-4">
                      <img
                        src={`data:image/jpeg;base64,${preg.foto64}`}
                        alt="Pregunta"
                        className="w-full max-w-xs mx-auto sm:w-32 sm:h-32 object-cover rounded border"
                        style={{ minHeight: "auto" }}
                      />
                    </div>
                  )}
                  <div className="sm:overflow-hidden">
                    {typeof preg.pregunta === "string" && (
                      <div className="font-semibold mb-4">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                          {idx + 1}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: preg.pregunta }} />
                      </div>
                    )}
                    {Array.isArray(preg.opciones) && (
                      <div className="mb-4 space-y-2">
                        {preg.opciones.map((op: any) => {
                          if (typeof op === "object" && op.opcion && op.respuesta) {
                            const isCorrect = op.respuestaSN === -1;
                            const isSelected = respuestas[`${preg.preguntaCodigo || idx}`] === op.opcion;
                            let resultClass = '';
                            // Mostrar resultado solo si el test fue enviado
                            if (resultados.mostrar) {
                              const opcionCorrecta = preg.opciones.find((opc: any) => opc.respuestaSN === -1);
                              const isUserWrong = isSelected && opcionCorrecta && op.opcion !== opcionCorrecta.opcion;
                              if (isCorrect) {
                                resultClass = 'bg-green-50 border-green-200';
                              } else if (isUserWrong) {
                                resultClass = 'bg-red-50 border-red-200';
                              }
                            }
                            return (
                              <label
                                key={op.opcion}
                                className={`flex items-start p-2 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${resultClass}`}
                              >
                                <input
                                  type="radio"
                                  name={`pregunta-${preg.preguntaCodigo || idx}`}
                                  value={op.opcion}
                                  checked={isSelected}
                                  onChange={() => {
                                    setRespuestas(prev => ({
                                      ...prev,
                                      [`${preg.preguntaCodigo || idx}`]: op.opcion
                                    }));
                                  }}
                                  className="mt-1 mr-3"
                                  disabled={resultados.mostrar}
                                />
                                <div>
                                  <span className="font-medium">{op.opcion}:</span>{' '}
                                  <span dangerouslySetInnerHTML={{ __html: op.respuesta }} />
                                  {/* Si la respuesta es correcta y el usuario se equivocó, mostrar el check verde */}
                                  {resultados.mostrar && isCorrect && respuestas[`${preg.preguntaCodigo || idx}`] !== op.opcion ? (
                                    <span className="ml-2 text-green-600 font-bold">✔ Correcta</span>
                                  ) : null}
                                  {/* Si la respuesta es la seleccionada y es incorrecta, mostrar la X roja */}
                                  {resultados.mostrar && isSelected && !isCorrect ? (
                                    <span className="ml-2 text-red-600 font-bold">✗ Tu respuesta</span>
                                  ) : null}
                                </div>
                              </label>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                    {typeof preg.texts === "string" && preg.texts && (
                      <details className="mt-2 text-sm bg-blue-50 rounded-lg">
                        <summary className="p-2 cursor-pointer text-blue-700 hover:text-blue-800 font-medium flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Ver ayuda para esta pregunta
                        </summary>
                        <div className="p-3 border-t border-blue-100 bg-white" dangerouslySetInnerHTML={{ __html: preg.texts }} />
                      </details>
                    )}

                    {/* Índice fijo debajo de la pregunta */}
                    <div className="flex flex-wrap justify-center gap-2 mt-8">
                      {preguntas.map((_, i) => {
                        const key = `${preguntas[i].preguntaCodigo || i}`;
                        const isAnswered = respuestas[key] !== undefined;
                        let colorClass = '';
                        if (resultados.mostrar && isAnswered) {
                          // Si el test fue enviado, marcar incorrectas en rojo
                          const opcionCorrecta = preguntas[i].opciones.find((op: any) => op.respuestaSN === -1);
                          const isCorrect = opcionCorrecta && respuestas[key] === opcionCorrecta.opcion;
                          colorClass = isCorrect
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-red-500 text-white border-red-500';
                        } else if (isAnswered) {
                          colorClass = 'bg-green-500 text-white border-green-500';
                        } else {
                          colorClass = 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50';
                        }
                        return (
                          <button
                            key={i}
                            onClick={() => setPreguntaActual(i)}
                            className={`px-3 py-1 rounded-full border text-sm font-semibold transition-colors ${preguntaActual === i ? 'bg-blue-600 text-white border-blue-600' : colorClass}`}
                          >
                            <span>{i + 1}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Botón para mostrar/ocultar detalles adicionales */}
                    <details className="mt-4 text-sm bg-gray-50 rounded-lg p-4">
                      <summary className="cursor-pointer text-gray-700 font-medium">
                        Ver información adicional
                      </summary>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-gray-600">
                        {preg.mm_menu && (
                          <div><span className="font-medium">Menú:</span> {preg.mm_menu}</div>
                        )}
                        {preg.mm_subMenu && (
                          <div><span className="font-medium">Sub-menú:</span> {preg.mm_subMenu}</div>
                        )}
                        {preg.mm_punto && (
                          <div><span className="font-medium">Punto:</span> {preg.mm_punto}</div>
                        )}
                        {preg.mm_subPunto && (
                          <div><span className="font-medium">Sub-punto:</span> {preg.mm_subPunto}</div>
                        )}
                        {preg.libro && (
                          <div><span className="font-medium">Libro:</span> {preg.libro}</div>
                        )}
                        {preg.capitulo && (
                          <div><span className="font-medium">Capítulo:</span> {preg.capitulo}</div>
                        )}
                        {preg.tema && (
                          <div><span className="font-medium">Tema:</span> {preg.tema}</div>
                        )}
                        {preg.preguntaCodigo && (
                          <div><span className="font-medium">Código pregunta:</span> {preg.preguntaCodigo}</div>
                        )}
                        {preg.refLibro && (
                          <div className="col-span-2"><span className="font-medium">Ref. Libro:</span> {preg.refLibro}</div>
                        )}
                        {preg.refLibroPubli && (
                          <div className="col-span-2"><span className="font-medium">Ref. Libro Publicado:</span> {preg.refLibroPubli}</div>
                        )}
                        {preg.refLibroPubliUrl && (
                          <div className="col-span-2">
                            <span className="font-medium">URL Libro:</span>
                            <a href={preg.refLibroPubliUrl} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 hover:underline ml-1">
                              {preg.refLibroPubliUrl}
                            </a>
                          </div>
                        )}
                        {preg.explicacion && (
                          <div className="col-span-2 mt-2">
                            <span className="font-medium block mb-1">Explicación:</span>
                            <div className="bg-white p-2 rounded border" dangerouslySetInnerHTML={{ __html: preg.explicacion }} />
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                  <div className="clear-both"></div>
                </div>
              </>
            );
          })()}

          {/* Botón flotante de enviar y resultados */}
          <div className="mt-8 space-y-4 mb-20">
            {!resultados.mostrar ? (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Tiempo transcurrido: {formatearTiempo(tiempoTranscurrido)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {Object.keys(respuestas).length} de {preguntas.length} respondidas
                    </div>
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Enviar respuestas
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div id="resultados-test" className="p-4 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-bold mb-3">Resultados del test</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-green-700 font-medium">Correctas</div>
                    <div className="text-2xl font-bold text-green-800">{resultados.correctas}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-red-700 font-medium">Incorrectas</div>
                    <div className="text-2xl font-bold text-red-800">{resultados.incorrectas}</div>
                  </div>
                </div>
                <div className="mt-3 text-center text-gray-600">
                  Puntuación final: {((resultados.correctas / resultados.total) * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
