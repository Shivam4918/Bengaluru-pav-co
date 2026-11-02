import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import GlobalLiveDock from "@/components/GlobalLiveDock";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090d16",
};

export const metadata: Metadata = {
  title: "Bengaluru Pav Co. | Authentic Street-Food Kitchen (Bengaluru)",
  description:
    "Artisanal Vada Pav, Cheese Burst Pav, Misal Pav, and Kadak Masala Cutting Chai in Bengaluru. Real-time kitchen tracking & live token buzzer.",
  keywords: [
    "Vada Pav Bengaluru",
    "Bengaluru Pav Co",
    "Koramangala Street Food",
    "Authentic Vada Pav",
    "Cutting Chai",
    "Cheese Vada Pav",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen w-full overflow-x-hidden relative selection:bg-orange-500 selection:text-white">
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
          {children}
        </Suspense>
        <GlobalLiveDock />
      </body>
    </html>
  );
}
