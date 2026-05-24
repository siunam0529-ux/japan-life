import { type RecommendedApp } from "@/data/recommendedApps";
import { fetchITunesApp } from "@/lib/api/itunesApps";

function withITunesData(app: RecommendedApp, apiApp: Awaited<ReturnType<typeof fetchITunesApp>>): RecommendedApp {
  if (!apiApp) return { ...app };

  return {
    ...app,
    name: apiApp.trackName || app.name,
    iconUrl: apiApp.artworkUrl512 || apiApp.artworkUrl100 || app.iconUrl,
    appStoreUrl: apiApp.trackViewUrl || app.appStoreUrl,
    developerName: apiApp.artistName || app.developerName,
    priceText: apiApp.formattedPrice || app.priceText,
    isFree: apiApp.price === 0,
    apiSource: "itunes",
  };
}

export async function fetchRecommendedApps(apps: RecommendedApp[] = []): Promise<RecommendedApp[]> {
  const items = await Promise.all(
    apps.map(async (app) => {
      const apiApp = await fetchITunesApp(app.name);
      return withITunesData(app, apiApp);
    }),
  );

  return items;
}

export async function fetchRecommendedApp(id: string): Promise<RecommendedApp | undefined> {
  const items = await fetchRecommendedApps();
  return items.find((item) => item.id === id);
}
