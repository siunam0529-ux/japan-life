import type { Metadata, Viewport } from "next";
import { RecentTracker } from "@/components/RecentTracker";
import { RouteHistory } from "@/components/RouteHistory";
import { SplashScreen } from "@/components/SplashScreen";
import { createMetadata, pageSeo } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  ...createMetadata(pageSeo.home),
  applicationName: "Japan Life",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Japan Life",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#F6FAFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <RouteHistory />
        <RecentTracker />
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
