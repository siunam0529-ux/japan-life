import { recommendedApps, type RecommendedApp } from "@/data/recommendedApps";
import { fetchITunesApp } from "@/lib/api/itunesApps";

function withITunesData(app: RecommendedApp, apiApp: Awaited<ReturnType<typeof fetchITunesApp>>): RecommendedApp {
  if (!apiApp) return { ...app, apiSource: "mock" };

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

export async function fetchRecommendedApps(apps: RecommendedApp[] = recommendedApps): Promise<RecommendedApp[]> {
  const items = await Promise.all(
    apps.map(async (app) => {
      const apiApp = await fetchITunesApp(app.name);
      return withITunesData(app, apiApp);
    }),
  );

  return items;
}

export async function fetchRecommendedApp(id: string): Promise<RecommendedApp | undefined> {
  const app = recommendedApps.find((item) => item.id === id);
  if (!app) return undefined;
  const [item] = await fetchRecommendedApps([app]);
  return item;
}
