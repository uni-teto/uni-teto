import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  // Base das URLs absolutas da prévia de links (Open Graph)
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: "UniTeto",
  description: "Encontre moradia estudantil perto do seu campus",
  openGraph: { siteName: "UniTeto", locale: "pt_BR", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
