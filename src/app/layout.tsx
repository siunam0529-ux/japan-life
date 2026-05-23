import type { Metadata, Viewport } from "next";
import { GlobalBottomNav } from "@/components/GlobalBottomNav";
import { RecentTracker } from "@/components/RecentTracker";
import { RouteHistory } from "@/components/RouteHistory";
import { SplashScreen } from "@/components/SplashScreen";
import { UserDataSync } from "@/components/UserDataSync";
import { createMetadata, createSoftwareApplicationJsonLd, createWebSiteJsonLd, pageSeo } from "@/lib/seo";
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

const jsonLd = [createWebSiteJsonLd(), createSoftwareApplicationJsonLd()];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
          type="application/ld+json"
        />
        <RouteHistory />
        <RecentTracker />
        <UserDataSync />
        <SplashScreen />
        {children}
        <GlobalBottomNav />
      </body>
    </html>
  );
}
