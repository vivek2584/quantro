'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { DarkModeProvider } from "@/context/DarkModeContext";
import { Toaster } from 'react-hot-toast';

// Initialize Inter font with preload disabled to prevent font loading issues
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: false,
  fallback: ['system-ui', 'sans-serif']
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
        <DarkModeProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            {children}
          </AuthProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}
