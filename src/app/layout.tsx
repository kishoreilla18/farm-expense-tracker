import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Suspense } from "react";
import SweetAlertHandler from "@/components/SweetAlertHandler";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700"]
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Farm Expense Tracker",
  description: "Track what you spend on labour, fertilizer, fuel, rent and more — field by field.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-main.jpg" },
      { url: "/icons/icon-1.png" }
    ],
    shortcut: "/icons/icon-main.jpg",
    apple: "/icons/icon-main.jpg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1F3D2B"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-body flex min-h-screen flex-col bg-paper text-ink antialiased">
        <Suspense fallback={null}>
          <SweetAlertHandler />
        </Suspense>
        <div className="flex-1">{children}</div>
        <footer className="py-6 text-center text-xs text-ink/40">
          Developed with ❤️ by Kishore
        </footer>
      </body>
    </html>
  );
}
