import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Portal Viçosa",
  description: "Educação, Transporte e Esporte em um só lugar.",
  icons: {
    icon: "/brand/brasao-vicosa.png",
    shortcut: "/brand/brasao-vicosa.png",
    apple: "/brand/brasao-vicosa.png"
  }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
