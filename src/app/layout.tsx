import type { Metadata } from "next";
import { Literata, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Filmtersect",
  description: "Find where two film careers overlap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${sora.variable} ${literata.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
