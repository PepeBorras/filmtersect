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

const SITE_URL = "https://filmtersect.vercel.app";
const OPEN_GRAPH_IMAGE_URL = `${SITE_URL}/social-share.png`;

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
    "og:image": OPEN_GRAPH_IMAGE_URL,
    "og:image:secure_url": OPEN_GRAPH_IMAGE_URL,
    "og:image:type": "image/png",
    "og:image:width": "718",
    "og:image:height": "426",
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
