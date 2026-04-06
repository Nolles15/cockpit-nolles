import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Cockpit Nolles",
  description: "Persoonlijk productiviteitsdashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${inter.className} h-full`}>
      <body className="min-h-full flex flex-col bg-[#f5f6fb] text-[#0f1117] antialiased">
        {children}
      </body>
    </html>
  );
}
