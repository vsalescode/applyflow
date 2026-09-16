import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AppyFlow",
  description: "Descoberta inteligente de vagas e preparação de candidaturas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
