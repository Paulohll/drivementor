"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeToAuthChanges, signInWithGoogle, logout } from "../../firebaseAuth";
import type { User } from "firebase/auth";
import { APP_CONFIG } from "../../config/app";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u: any) => {
      setUser(u);
      if (u) {
        // Guardar cookie para el middleware
        document.cookie = `firebaseUser=${u.uid}; path=/;`;
        router.replace("/");
      } else {
        // Eliminar cookie si no hay usuario
        document.cookie = "firebaseUser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      }
    });
    return unsubscribe;
  }, [router]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      alert("Error al iniciar sesión con Google");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
      {/* Header con branding */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
          <span className="text-4xl sm:text-5xl lg:text-6xl">{APP_CONFIG.icons.main}</span>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">{APP_CONFIG.name}</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">{APP_CONFIG.tagline}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-sm sm:max-w-md border border-gray-100">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-800">Iniciar sesión</h2>
        {user ? (
          <>
            <div className="mb-4 text-center">
              <div className="font-medium text-sm sm:text-base">{user.displayName || user.email}</div>
              {user.photoURL && <img src={user.photoURL} alt="avatar" className="mx-auto rounded-full w-12 h-12 sm:w-16 sm:h-16 mt-2" />}
            </div>
            <button
              onClick={async () => { await logout(); }}
              className="w-full py-2.5 sm:py-3 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold mb-2 transition-colors text-sm sm:text-base"
            >
              Cerrar sesión
            </button>
            <p className="text-center text-xs sm:text-sm text-gray-500">Redirigiendo...</p>
          </>
        ) : (
          <>
            <div className="text-center mb-4 sm:mb-6">
              <p className="text-gray-600 mb-4 text-sm sm:text-base">Accede a tu plataforma de preparación para el carnet de conducir</p>
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span className="hidden sm:inline">Iniciando sesión...</span>
                  <span className="sm:hidden">Iniciando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="hidden sm:inline">Continuar con Google</span>
                  <span className="sm:hidden">Google</span>
                </>
              )}
            </button>
            
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-xs text-gray-500">
                Al continuar, aceptas nuestros términos de servicio y política de privacidad
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-6 sm:mt-8 text-center text-gray-500 text-xs sm:text-sm px-4">
        <p>© 2025 {APP_CONFIG.name}. Preparación profesional para tu carnet de conducir.</p>
      </div>
    </div>
  );
}
