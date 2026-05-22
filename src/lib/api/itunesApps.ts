export type ITunesAppInfo = {
  trackName: string;
  artworkUrl100: string;
  artworkUrl512: string;
  trackViewUrl: string;
  artistName: string;
  formattedPrice: string;
  price: number;
};

type ITunesSearchResult = {
  resultCount: number;
  results: Array<Partial<ITunesAppInfo>>;
};

export async function fetchITunesApp(term: string): Promise<ITunesAppInfo | null> {
  try {
    const url = new URL("https://itunes.apple.com/search");
    url.searchParams.set("term", term);
    url.searchParams.set("country", "jp");
    url.searchParams.set("entity", "software");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), { cache: "force-cache" });
    if (!response.ok) return null;

    const data = (await response.json()) as ITunesSearchResult;
    const item = data.results[0];
    if (!item?.trackName || !item.trackViewUrl) return null;

    return {
      trackName: item.trackName,
      artworkUrl100: item.artworkUrl100 ?? "",
      artworkUrl512: item.artworkUrl512 ?? item.artworkUrl100 ?? "",
      trackViewUrl: item.trackViewUrl,
      artistName: item.artistName ?? "",
      formattedPrice: item.formattedPrice ?? (item.price === 0 ? "無料" : ""),
      price: typeof item.price === "number" ? item.price : 0,
    };
  } catch {
    return null;
  }
}

export async function fetchITunesApps(terms: string[]) {
  const pairs = await Promise.all(
    terms.map(async (term) => {
      const result = await fetchITunesApp(term);
      return [term, result] as const;
    }),
  );

  return Object.fromEntries(pairs);
}
