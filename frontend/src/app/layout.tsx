import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ANPR Platform — Vehicle Number Plate Recognition",
  description: "AI-powered Automatic Number Plate Recognition system for Indian vehicles. Real-time detection, analytics, and smart alerts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#0d1520",
                color: "#e2eeff",
                border: "1px solid rgba(42,82,130,0.4)",
              },
            }}
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
