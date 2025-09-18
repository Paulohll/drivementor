'use client';

import { useEffect, useState } from 'react';
import RequireAuth from './RequireAuth';
import Link from 'next/link';
import { fetchTestList, updateTestDescription, type Test } from '../firestoreClient';
import { APP_CONFIG } from '../config/app';

interface MenuState {
  isOpen: boolean;
  testId: string | null;
}

interface EditModalState {
  isOpen: boolean;
  testId: string | null;
  description: string;
}

export default function Home() {
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('todos');
  const [menuState, setMenuState] = useState<MenuState>({ isOpen: false, testId: null });
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    testId: null,
    description: ''
  });
  const [updating, setUpdating] = useState(false);

  // Función para categorizar tests
  const categorizeTest = (test: Test): string => {
    const id = test.id;
    if (id.startsWith('735')) return 'tematica';
    if (id.startsWith('134')) return 'habituales';
    if (id.startsWith('41')) return 'especiales';
    return 'otros';
  };

  // Filtrar tests basado en la categoría seleccionada
  useEffect(() => {
    if (selectedFilter === 'todos') {
      setFilteredTests(tests);
    } else {
      const filtered = tests.filter(test => categorizeTest(test) === selectedFilter);
      setFilteredTests(filtered);
    }
  }, [tests, selectedFilter]);

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'tematica':
        return { 
          name: 'Temática', 
          icon: '📚', 
          description: 'Tests organizados por temas específicos',
          color: 'bg-blue-500'
        };
      case 'habituales':
        return { 
          name: 'Habituales', 
          icon: '🎯', 
          description: 'Tests con preguntas aleatorias similares al examen',
          color: 'bg-green-500'
        };
      case 'especiales':
        return { 
          name: 'Especiales', 
          icon: '⭐', 
          description: 'Tests especiales y de práctica avanzada',
          color: 'bg-purple-500'
        };
      default:
        return { 
          name: 'Otros', 
          icon: '📝', 
          description: 'Otros tipos de tests',
          color: 'bg-gray-500'
        };
    }
  };

  const getTestCounts = () => {
    const counts = {
      todos: tests.length,
      tematica: tests.filter(test => categorizeTest(test) === 'tematica').length,
      habituales: tests.filter(test => categorizeTest(test) === 'habituales').length,
      especiales: tests.filter(test => categorizeTest(test) === 'especiales').length,
      otros: tests.filter(test => categorizeTest(test) === 'otros').length
    };
    return counts;
  };

  useEffect(() => {
    setLoading(true);
    fetchTestList()
      .then((testList) => {
        // Ordenar por ID de menor a mayor
        const sortedTests = testList.sort((a, b) => 
          parseInt(a.id) - parseInt(b.id)
        );
        setTests(sortedTests);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading tests:", err);
        setError("Error al cargar los tests");
        setLoading(false);
      });
  }, []);

  // Efecto para cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container')) {
        setMenuState({ isOpen: false, testId: null });
      }
    };

    if (menuState.isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuState.isOpen]);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Tests Disponibles</h1>
        <div>Cargando tests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Tests Disponibles</h1>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const handleUpdateDescription = async () => {
    if (!editModal.testId || !editModal.description.trim()) return;
    
    setUpdating(true);
    try {
      await updateTestDescription(editModal.testId, editModal.description.trim());
      
      // Actualizar el estado local
      setTests(tests.map(test => 
        test.id === editModal.testId 
          ? { ...test, description: editModal.description.trim() }
          : test
      ));
      
      setEditModal({ isOpen: false, testId: null, description: '' });
    } catch (err) {
      console.error('Error al actualizar la descripción:', err);
      alert('Error al actualizar la descripción');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <RequireAuth>
      <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl">{APP_CONFIG.icons.main}</span>
            <span className="hidden sm:inline">Tests Disponibles - {APP_CONFIG.name}</span>
            <span className="sm:hidden">Tests</span>
          </h1>
          {/* <p className="text-gray-600">{APP_CONFIG.tagline} - Selecciona una categoría para filtrar los tests</p> */}
        </div>

        {/* Filtros de categoría */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            {/* Botón Todos */}
            <button
              onClick={() => setSelectedFilter('todos')}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                selectedFilter === 'todos'
                  ? 'bg-gray-800 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <span className="text-lg">📋</span>
              <div className="flex flex-col items-start">
                <span>Todos</span>
                <span className="text-xs opacity-75">{getTestCounts().todos} tests</span>
              </div>
            </button>

            {/* Botones de categorías */}
            {(['tematica', 'habituales', 'especiales'] as const).map((category) => {
              const info = getCategoryInfo(category);
              const count = getTestCounts()[category];
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedFilter(category)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    selectedFilter === category
                      ? `${info.color} text-white shadow-lg transform scale-105`
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <span className="text-lg">{info.icon}</span>
                  <div className="flex flex-col items-start">
                    <span>{info.name}</span>
                    <span className="text-xs opacity-75">{count} tests</span>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Descripción de la categoría seleccionada */}
          {selectedFilter !== 'todos' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getCategoryInfo(selectedFilter).icon}</span>
                <h3 className="font-semibold text-blue-800">{getCategoryInfo(selectedFilter).name}</h3>
              </div>
              <p className="text-blue-600 text-sm">{getCategoryInfo(selectedFilter).description}</p>
            </div>
          )}
        </div>

        {/* Información de resultados */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedFilter === 'todos' 
              ? `Mostrando ${filteredTests.length} tests en total`
              : `Mostrando ${filteredTests.length} tests de la categoría "${getCategoryInfo(selectedFilter).name}"`
            }
          </div>
          
          {filteredTests.length > 0 && (
            <div className="text-sm text-gray-500">
              Ordenados por ID
            </div>
          )}
        </div>
        {/* Modal de edición */}
        {editModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Editar descripción del test</h2>
              <textarea
                value={editModal.description}
                onChange={(e) => setEditModal(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border rounded-lg mb-4 h-32 resize-none"
                placeholder="Ingresa una descripción para el test..."
                disabled={updating}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditModal({ isOpen: false, testId: null, description: '' })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateDescription}
                  disabled={updating || !editModal.description.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {updating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Guardando...
                    </>
                  ) : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredTests.map((test) => {
            const category = categorizeTest(test);
            const categoryInfo = getCategoryInfo(category);
            
            return (
              <div key={test.id} className="relative group bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                {/* Badge de categoría */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium text-white ${categoryInfo.color}`}>
                  {categoryInfo.icon} {categoryInfo.name}
                </div>
                
                {/* Botón de menú */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuState(prev => ({
                      isOpen: prev.testId === test.id ? !prev.isOpen : true,
                      testId: test.id
                    }));
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              {/* Menú desplegable */}
              {menuState.isOpen && menuState.testId === test.id && (
                <div className="absolute top-10 right-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setEditModal({
                          isOpen: true,
                          testId: test.id,
                          description: test.description || ''
                        });
                        setMenuState({ isOpen: false, testId: null });
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                      </svg>
                      Editar metadatos
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implementar gestión de preguntas
                        console.log('Gestionar preguntas del test:', test.id);
                        setMenuState({ isOpen: false, testId: null });
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      Gestionar preguntas
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implementar estadísticas
                        console.log('Ver estadísticas del test:', test.id);
                        setMenuState({ isOpen: false, testId: null });
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                      Ver estadísticas
                    </button>
                  </div>
                </div>
                )}
                {/* Contenido del test */}
                <Link 
                  href={`/questions/${test.id}`}
                  className="block p-6 pt-10"
                >
                  <div className="font-semibold mb-2">Test {test.id} - {test.description && (
                      test.description
                    )}</div>
                  <div className="text-sm text-gray-600">
                    <div>Prefijo: {test.prefijo}</div>
                    <div>Número de preguntas: {test.num_preguntas}</div>
                    <div>Fecha: {new Date(test.timestamp.seconds * 1000).toLocaleString()}</div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
        
        {/* Módulo de Estudio - Separado visualmente */}
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            📚 Módulo de Estudio
            <span className="text-sm font-normal bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              Nuevo
            </span>
          </h2>
          
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <Link href="/estudio" className="block">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
                    🎓 Estudiar Teoría
                  </h3>
                  <p className="text-purple-100 mb-4 text-lg leading-relaxed">
                    Accede al material de estudio con sistema de notas integrado y tracking de tiempo de estudio
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="bg-purple-400 bg-opacity-50 px-4 py-2 rounded-full text-sm font-medium">
                      📄 Documentos PDF
                    </span>
                    <span className="bg-purple-400 bg-opacity-50 px-4 py-2 rounded-full text-sm font-medium">
                      📝 Toma de notas
                    </span>
                    <span className="bg-purple-400 bg-opacity-50 px-4 py-2 rounded-full text-sm font-medium">
                      ⏱️ Tiempo trackado
                    </span>
                    <span className="bg-purple-400 bg-opacity-50 px-4 py-2 rounded-full text-sm font-medium">
                      💾 Auto-guardado
                    </span>
                  </div>
                </div>
                <div className="text-6xl opacity-75 ml-6">
                  📖
                </div>
              </div>
            </Link>
          </div>
        </div>

        {filteredTests.length === 0 && selectedFilter !== 'todos' && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">{getCategoryInfo(selectedFilter).icon}</div>
            <div className="text-gray-500 text-lg mb-2">No hay tests disponibles en esta categoría</div>
            <div className="text-gray-400 text-sm">Intenta con otra categoría o selecciona "Todos" para ver todos los tests</div>
          </div>
        )}
        {tests.length === 0 && (
          <div className="text-gray-500">No se encontraron tests disponibles.</div>
        )}
      </div>
    </RequireAuth>
  );
}
