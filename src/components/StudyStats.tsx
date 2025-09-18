import React from 'react';

interface StudyStatsProps {
  totalNotes: number;
  totalStudyTime: number;
  materialsStudied: number;
  currentSessionTime: number;
  isTracking: boolean;
}

export function StudyStats({ 
  totalNotes, 
  totalStudyTime, 
  materialsStudied, 
  currentSessionTime,
  isTracking 
}: StudyStatsProps) {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours < 1) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const getStudyLevel = (totalTime: number): { level: number; name: string; nextLevelTime: number; progress: number } => {
    const levels = [
      { time: 0, name: "Principiante" },
      { time: 3600, name: "Estudiante" }, // 1 hora
      { time: 7200, name: "Dedicado" }, // 2 horas
      { time: 14400, name: "Comprometido" }, // 4 horas
      { time: 28800, name: "Avanzado" }, // 8 horas
      { time: 57600, name: "Experto" }, // 16 horas
      { time: 115200, name: "Maestro" }, // 32 horas
    ];

    let currentLevel = levels.findIndex(level => totalTime < level.time);
    if (currentLevel === -1) currentLevel = levels.length;
    
    const level = currentLevel === 0 ? 1 : currentLevel;
    const levelName = levels[Math.min(level - 1, levels.length - 1)].name;
    const nextLevelTime = currentLevel < levels.length ? levels[currentLevel].time : levels[levels.length - 1].time;
    const currentLevelTime = currentLevel > 0 ? levels[currentLevel - 1].time : 0;
    
    const progress = currentLevel < levels.length 
      ? ((totalTime - currentLevelTime) / (nextLevelTime - currentLevelTime)) * 100
      : 100;

    return { level, name: levelName, nextLevelTime, progress };
  };

  const studyLevel = getStudyLevel(totalStudyTime);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tiempo de sesión actual */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Sesión Actual</p>
            <p className="text-xl font-bold text-green-600">{formatTime(currentSessionTime)}</p>
          </div>
        </div>
      </div>

      {/* Total de notas */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📝</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Notas Tomadas</p>
            <p className="text-xl font-bold text-purple-600">{totalNotes}</p>
          </div>
        </div>
      </div>

      {/* Tiempo total de estudio */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="text-2xl">⏱️</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Tiempo Total</p>
            <p className="text-xl font-bold text-blue-600">{formatTime(totalStudyTime)}</p>
          </div>
        </div>
      </div>

      {/* Nivel de estudio */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏆</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">Nivel</p>
            <p className="text-lg font-bold text-orange-600">{studyLevel.name}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(studyLevel.progress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}