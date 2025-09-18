"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "../../firebaseAuth";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    logout().then(() => {
      // Eliminar cookie de usuario
      document.cookie = "firebaseUser=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      router.replace("/login");
    });
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow text-center">
        <h1 className="text-xl font-bold mb-4">Cerrando sesión...</h1>
        <p>Por favor espera un momento.</p>
      </div>
    </div>
  );
}
