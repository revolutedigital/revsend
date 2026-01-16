import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";

// Fonte display para títulos - geométrica com personalidade
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Fonte body para legibilidade
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RevSend - Prospecção que Converte",
  description: "Dispare mensagens no WhatsApp sem bloqueios. Prospecção ativa inteligente com rotação de números e mensagens.",
  keywords: ["whatsapp", "prospecção", "vendas", "disparo em massa", "marketing"],
  authors: [{ name: "RevSend" }],
  openGraph: {
    title: "RevSend - Prospecção que Converte",
    description: "Dispare mensagens no WhatsApp sem bloqueios. Sistema anti-bloqueio inteligente.",
    type: "website",
    locale: "pt_BR",
    siteName: "RevSend",
  },
  twitter: {
    card: "summary_large_image",
    title: "RevSend - Prospecção que Converte",
    description: "Dispare mensagens no WhatsApp sem bloqueios. Sistema anti-bloqueio inteligente.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
