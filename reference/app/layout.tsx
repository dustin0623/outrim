import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";

const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const OG_IMAGE = {
  url: "/brand/outrim-og.png",
  width: 1200,
  height: 630,
  alt: "Outrim — Mine. Salvage. Outlast.",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Outrim — Mine. Salvage. Outlast.",
  description:
    "Build a frontier rig, extract Alloy (HASH), secure your haul and trade modules on Hive.",
  openGraph: {
    title: "Outrim — Mine. Salvage. Outlast.",
    description:
      "Build a frontier rig, extract Alloy (HASH), secure your haul and trade modules on Hive.",
    type: "website",
    siteName: "Outrim",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Outrim — Mine. Salvage. Outlast.",
    description:
      "Build a frontier rig, extract Alloy (HASH), secure your haul and trade modules on Hive.",
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
      },
      {
        rel: "android-chrome",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
