import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bilateral — The debate behind every headline.",
  description: "Drop any headline. Watch conservative and liberal analysts debate it at full depth — arguments, rebuttals, and where they actually agree.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://bilateral.news"),
  openGraph: {
    title: "Bilateral",
    description: "Drop any headline. Watch conservative and liberal analysts debate it at full depth — arguments, rebuttals, and where they actually agree.",
    url: "https://bilateral.news",
    siteName: "Bilateral",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bilateral",
    description: "Drop any headline. Watch conservative and liberal analysts debate it at full depth — arguments, rebuttals, and where they actually agree.",
    site: "@bilateralnews",
  },
  verification: {
    google: "aDr9H4menYr1FZLbgX0QPVeDehQpPvmaucznYZNp0IM",
    other: {
      "msvalidate.01": "CC095FB95C12E266D735DF6ADED69649",
    },
  },
  alternates: {
    canonical: 'https://bilateral.news',
    types: { 'application/rss+xml': '/feed.xml' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
