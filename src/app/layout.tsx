import type { Metadata, Viewport } from "next";
import { AppPreloader } from "@/components/AppPreloader";
import { GlobalBackButton } from "@/components/GlobalBackButton";
import { GlobalBottomNav } from "@/components/GlobalBottomNav";
import { PullToRefresh } from "@/components/PullToRefresh";
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
const linkswitchTag = process.env.NEXT_PUBLIC_VALUECOMMERCE_LINKSWITCH_TAG?.trim() ?? "";

function LinkSwitchScript() {
  if (!linkswitchTag) return null;
  if (/<script[\s>]/i.test(linkswitchTag)) {
    return <div dangerouslySetInnerHTML={{ __html: linkswitchTag }} suppressHydrationWarning />;
  }
  return <script dangerouslySetInnerHTML={{ __html: linkswitchTag }} suppressHydrationWarning />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
          type="application/ld+json"
        />
        <LinkSwitchScript />
        <RouteHistory />
        <RecentTracker />
        <UserDataSync />
        <AppPreloader />
        <SplashScreen />
        <PullToRefresh />
        {children}
        <GlobalBackButton />
        <GlobalBottomNav />
      </body>
    </html>
  );
}
