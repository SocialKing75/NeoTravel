import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neotravel - Transport de groupe intelligent",
  description:
    "Plateforme d'automatisation commerciale avec agent IA, devis et suivi des demandes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
