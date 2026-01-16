import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

// Fonte display para titulos - geometrica com personalidade
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
  title: "RevSend - Prospecao que Converte",
  description: "Dispare mensagens no WhatsApp sem bloqueios. Prospecao ativa inteligente com rotacao de numeros e mensagens.",
  keywords: ["whatsapp", "prospecao", "vendas", "disparo em massa", "marketing"],
  authors: [{ name: "RevSend" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "RevSend - Prospecao que Converte",
    description: "Dispare mensagens no WhatsApp sem bloqueios. Sistema anti-bloqueio inteligente.",
    type: "website",
    locale: "pt_BR",
    siteName: "RevSend",
  },
  twitter: {
    card: "summary_large_image",
    title: "RevSend - Prospecao que Converte",
    description: "Dispare mensagens no WhatsApp sem bloqueios. Sistema anti-bloqueio inteligente.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
