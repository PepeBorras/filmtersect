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
  metadataBase: new URL("https://filmtersect.vercel.app"),
  title: "Filmtersect",
  description: "Find where two film careers overlap.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "Filmtersect",
    description: "Find where two film careers overlap.",
    type: "website",
    images: [
      {
        url: "/social-share.png",
        alt: "Filmtersect social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Filmtersect",
    description: "Find where two film careers overlap.",
    images: ["/social-share.png"],
  },
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
