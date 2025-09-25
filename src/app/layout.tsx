import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Header from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Marketplace Turismo - Viví Argentina a tu manera",
  description: "Elegí entre alojamientos, actividades, excursiones y medios para moverte. Todo en un solo lugar, seguro y fácil de reservar.",
  keywords: "turismo, alquiler, hoteles, aventuras, viajes, España",
  authors: [{ name: "Marketplace Turismo" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-background-light via-green-50 to-background-light dark:from-background-dark dark:via-gray-900 dark:to-background-dark">
            <Header />
            <main>
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
