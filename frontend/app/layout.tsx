import type { Metadata } from "next";
import "./globals.css";
import ApiFetchRedirect from "../components/ApiFetchRedirect";
import Footer from "../components/Footer";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "SwiftHire | Find Jobs and Talent Faster",
    template: "%s | SwiftHire",
  },
  description:
    "SwiftHire is a modern hiring platform for job seekers and employers, featuring job applications, talent search, company profiles, and realtime messaging.",
  keywords: [
    "SwiftHire",
    "jobs",
    "job platform",
    "hiring platform",
    "talent search",
    "job seekers",
    "employers",
    "recruitment",
    "career platform",
  ],
  authors: [{ name: "SwiftHire" }],
  creator: "SwiftHire",
  publisher: "SwiftHire",
  metadataBase: new URL("https://useswifthire.com"),
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "SwiftHire | Find Jobs and Talent Faster",
    description:
      "A modern hiring platform connecting job seekers and employers through profiles, job applications, and realtime messaging.",
    url: "https://useswifthire.com",
    siteName: "SwiftHire",
    type: "website",
    images: [
      {
        url: "/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "SwiftHire - Find Jobs and Talent Faster",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftHire | Find Jobs and Talent Faster",
    description:
      "A modern hiring platform connecting job seekers and employers through profiles, job applications, and realtime messaging.",
    images: ["/og-image.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
        <ApiFetchRedirect />
        <div className="flex-1">{children}</div>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}