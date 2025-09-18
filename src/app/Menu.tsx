"use client";
import Link from "next/link";
import { useAuth } from "../AuthContext";
import { useTimeTracker } from "../useTimeTracker";
import { APP_CONFIG } from "../config/app";

export default function Menu() {
  const { user } = useAuth();
  const { totalTime, isTracking, formatTime } = useTimeTracker(user);

  // No mostrar el menú si el usuario no está autenticado
  if (!user) {
    return null;
  }

  return (
    <nav className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-3 px-4 sm:px-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        {/* Logo y nombre */}
        <div className="font-bold text-lg sm:text-xl flex items-center gap-2">
          <span className="text-xl sm:text-2xl">{APP_CONFIG.icons.main}</span>
          <Link href={APP_CONFIG.routes.home} className="hover:text-blue-200 transition-colors">
            {APP_CONFIG.name}
          </Link>
        </div>
        
        {/* Navigation y tiempo */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 sm:items-center">
          {/* Tracker de tiempo - TEMPORALMENTE OCULTO */}
          {false && user && (
            <div className="flex items-center gap-2 bg-blue-800 bg-opacity-50 px-3 py-2 rounded-lg text-xs sm:text-sm backdrop-blur-sm order-last sm:order-first">
              <span className="text-blue-200">{APP_CONFIG.icons.time}</span>
              <span className="font-medium">{formatTime(totalTime)}</span>
              <span className="text-blue-200 hidden sm:inline">aprendiendo</span>
              <span className={`w-2 h-2 rounded-full ml-1 sm:ml-2 ${isTracking ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
            </div>
          )}
          
          {/* Navigation links */}
          <div className="flex flex-wrap gap-2 sm:gap-4 text-sm sm:text-base">
            <Link href={APP_CONFIG.routes.tests} className="hover:text-blue-200 transition-colors font-medium flex items-center gap-1 px-2 py-1 rounded">
              <span className="sm:hidden">{APP_CONFIG.icons.tests}</span>
              <span className="hidden sm:inline">{APP_CONFIG.icons.tests} Tests</span>
              <span className="sm:hidden">Tests</span>
            </Link>
            {/* Estudio - TEMPORALMENTE OCULTO */}
            {false && (
              <Link href={APP_CONFIG.routes.study} className="hover:text-blue-200 transition-colors font-medium flex items-center gap-1 px-2 py-1 rounded">
                <span className="sm:hidden">{APP_CONFIG.icons.study}</span>
                <span className="hidden sm:inline">{APP_CONFIG.icons.study} Estudio</span>
                <span className="sm:hidden">Estudio</span>
              </Link>
            )}
            <Link href={APP_CONFIG.routes.stats} className="hover:text-blue-200 transition-colors flex items-center gap-1 px-2 py-1 rounded">
              <span className="sm:hidden">{APP_CONFIG.icons.stats}</span>
              <span className="hidden sm:inline">{APP_CONFIG.icons.stats} Estadísticas</span>
              <span className="sm:hidden">Stats</span>
            </Link>
            <Link href={APP_CONFIG.routes.failures} className="hover:text-blue-200 transition-colors flex items-center gap-1 px-2 py-1 rounded">
              <span className="sm:hidden">{APP_CONFIG.icons.failures}</span>
              <span className="hidden sm:inline">{APP_CONFIG.icons.failures} Fallos</span>
              <span className="sm:hidden">Fallos</span>
            </Link>
            <Link href={APP_CONFIG.routes.logout} className="hover:text-blue-200 transition-colors px-2 py-1 rounded">Salir</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
