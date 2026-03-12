import type { Metadata } from "next";
import { Literata, Sora } from "next/font/google";
import { Suspense } from "react";

import { PosterGrid } from "@/components/background/PosterGrid";

import "./globals.css";

const sora = Sora({
  variable: "--font-sans",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-serif",
  subsets: ["latin"],
});

const SITE_URL = "https://filmtersect.vercel.app";
const OPEN_GRAPH_IMAGE_URL = `${SITE_URL}/social-share.png`;
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    url: SITE_URL,
    images: [
      {
        url: OPEN_GRAPH_IMAGE_URL,
        width: 718,
        height: 426,
        type: "image/png",
        alt: "Filmtersect social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Filmtersect",
    description: "Find where two film careers overlap.",
    images: [OPEN_GRAPH_IMAGE_URL],
  },
  other: {
    "og:url": SITE_URL,
    "og:image": OPEN_GRAPH_IMAGE_URL,
    "og:image:secure_url": OPEN_GRAPH_IMAGE_URL,
    "og:image:type": "image/png",
    "og:image:width": "718",
    "og:image:height": "426",
    ...(FACEBOOK_APP_ID ? { "fb:app_id": FACEBOOK_APP_ID } : {}),
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
        <div className="relative min-h-screen overflow-x-hidden">
          {/* Decorative poster grid background */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <PosterGrid />
          </div>
          {/* Foreground interface layer */}
          <main className="relative z-10 flex flex-col items-center w-full min-h-screen">
            <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/60 h-[70vh] overflow-y-auto mt-[15%]">
              <Suspense fallback={<div className="text-sm text-stone-600">Loading comparison tools...</div>}>
                {children}
              </Suspense>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
