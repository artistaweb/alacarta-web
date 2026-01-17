import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "A la Carta",
  description: "Guía gastronómica de Puerto Rico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>


        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
