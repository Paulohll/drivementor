"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else {
        setChecked(true);
      }
    }
  }, [user, loading, router]);

  if (loading || !checked) {
    return <div className="w-full min-h-screen flex items-center justify-center">Cargando autenticación...</div>;
  }
  
  return <>{children}</>;
}
