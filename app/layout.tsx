import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEALFORM — Domain Hand-Sign Trainer",
  description:
    "Learn Jujutsu Kaisen Domain Expansion hand signs with sourced references, private webcam tracking, and on-device personalized recognition.",
  applicationName: "SEALFORM",
  keywords: ["hand sign", "webcam trainer", "MediaPipe", "Jujutsu Kaisen", "Domain Expansion"],
  openGraph: {
    title: "SEALFORM — Master the gesture. Hold the form.",
    description: "Private, on-device coaching for Domain Expansion hand signs.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SEALFORM",
    description: "A private, on-device Domain hand-sign trainer.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
