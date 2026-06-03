import { exportJapanLifeData, hasJapanLifeLocalData } from "@/lib/localDataBackup";

const fallbackSiteUrl = "https://japan-life.vercel.app";

function getConfiguredSiteOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackSiteUrl;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallbackSiteUrl;
    return url.origin;
  } catch {
    return fallbackSiteUrl;
  }
}

function isLocalOrPrivateHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  if (normalized === "localhost" || normalized === "0.0.0.0" || normalized === "::1") return true;
  if (normalized.startsWith("127.")) return true;
  if (normalized.startsWith("10.")) return true;
  if (normalized.startsWith("192.168.")) return true;
  const private172 = normalized.match(/^172\.(\d+)\./);
  return private172 ? Number(private172[1]) >= 16 && Number(private172[1]) <= 31 : false;
}

function shouldUseCurrentOrigin() {
  if (typeof window === "undefined") return false;
  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") return false;
  return !isLocalOrPrivateHost(window.location.hostname);
}

function normalizeAppPath(path: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

export function getAuthRedirectOrigin() {
  if (shouldUseCurrentOrigin()) return window.location.origin;
  return getConfiguredSiteOrigin();
}

export function createAuthRedirectUrl(path: string) {
  return `${getAuthRedirectOrigin()}${normalizeAppPath(path)}`;
}

export async function syncLocalDataBeforeAuthRedirect(accessToken?: string) {
  if (!accessToken || typeof window === "undefined" || !hasJapanLifeLocalData()) return;
  try {
    await fetch("/api/user-app-data", {
      body: JSON.stringify({ data: exportJapanLifeData() }),
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      method: "PUT",
    });
  } catch {
    // Do not block login navigation if cloud sync is temporarily unavailable.
  }
}

export async function replaceAfterAuth(router: { replace: (href: string) => void }, path: string, accessToken?: string) {
  const normalizedPath = normalizeAppPath(path);
  await syncLocalDataBeforeAuthRedirect(accessToken);
  if (typeof window !== "undefined" && getAuthRedirectOrigin() !== window.location.origin) {
    window.location.assign(createAuthRedirectUrl(normalizedPath));
    return;
  }
  router.replace(normalizedPath);
}
