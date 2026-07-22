import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HomeScreenModalHost } from "@/components/HomeScreenModalHost";
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
  title: "Bubblecast — language tutoring in living scenes",
  description:
    "Learn Spanish through AI comic warmups, live speech-bubble scenes, and travel/work missions with a recurring cast.",
  applicationName: "Bubblecast",
  metadataBase: new URL("https://bubblecast.vercel.app"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Bubblecast",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Bubblecast",
    description:
      "Learn Spanish by starring in a coastal sitcom — comics, live scenes, unlocks.",
    url: "https://bubblecast.vercel.app",
    siteName: "Bubblecast",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Bubblecast",
    description:
      "Learn Spanish through living cartoon scenes, missions, and a vocab journal.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f97316" },
    { media: "(prefers-color-scheme: dark)", color: "#ea580c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ErrorBoundary>{children}</ErrorBoundary>
        <HomeScreenModalHost />
      </body>
    </html>
  );
}
