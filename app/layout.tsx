import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
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

export const metadata: Metadata = {
  title: "Bilateral — The argument behind every headline.",
  description: "Conservative and liberal analysts debate every major story at full depth. See the argument, not just the headline.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://bilateral.news"),
  openGraph: {
    title: "Bilateral",
    description: "Conservative and liberal analysts debate every major story at full depth. See the argument, not just the headline.",
    url: "https://bilateral.news",
    siteName: "Bilateral",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bilateral",
    description: "Conservative and liberal analysts debate every major story at full depth. See the argument, not just the headline.",
    site: "@bilateralnews",
  },
  verification: {
    google: "aDr9H4menYr1FZLbgX0QPVeDehQpPvmaucznYZNp0IM",
    other: {
      "msvalidate.01": "CC095FB95C12E266D735DF6ADED69649",
    },
  },
  alternates: {
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
