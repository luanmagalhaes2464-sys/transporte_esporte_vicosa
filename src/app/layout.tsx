import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Portal Viçosa", description: "Educação, Transporte e Esporte em um só lugar." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
