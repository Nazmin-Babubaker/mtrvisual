import "./globals.css";
import { JetBrains_Mono, Syne } from "next/font/google";
import type { Metadata } from "next";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });

export const metadata: Metadata = {
  title: "MTRVisual",
  description: "Real-time MTR and hop mapping",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${mono.variable} ${syne.variable}`}>
      <body>{children}</body>
    </html>
  );
}