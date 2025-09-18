
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Menu from "./Menu";
import { AuthProvider } from "../AuthContext";
import { APP_CONFIG } from "../config/app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - ${APP_CONFIG.tagline}`,
  description: APP_CONFIG.description,
  keywords: "carnet de conducir, examen teórico, DGT, test conducir, preparación examen",
  authors: [{ name: APP_CONFIG.name }],
  creator: APP_CONFIG.name,
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Menu />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
