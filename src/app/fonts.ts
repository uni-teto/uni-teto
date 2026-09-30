import { Geist, Geist_Mono } from "next/font/google";

// Fontes do site, usadas pelo layout e pela página de erro global (que
// substitui o layout e precisa carregar as próprias fontes)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Classes do <html> com as variáveis das fontes. */
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
