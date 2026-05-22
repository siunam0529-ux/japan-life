import { NextResponse, type NextRequest } from "next/server";
import { invalidAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";

type ITunesLookupItem = {
  artworkUrl512?: string;
  artworkUrl100?: string;
  genres?: string[];
  primaryGenreName?: string;
  trackId?: number;
  trackName?: string;
  trackViewUrl?: string;
};

type ITunesLookupResponse = {
  resultCount: number;
  results: ITunesLookupItem[];
};

function extractAppStoreId(input: string) {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/\/id(\d+)/);
  return match?.[1] ?? "";
}

function mapCategory(value: string | undefined) {
  const text = (value ?? "").toLowerCase();
  if (text.includes("navigation") || text.includes("travel")) return "transport";
  if (text.includes("finance") || text.includes("business")) return "payment";
  if (text.includes("food")) return "delivery";
  if (text.includes("education")) return "japanese";
  if (text.includes("medical") || text.includes("health")) return "medical";
  if (text.includes("shopping")) return "shopping";
  return "shopping";
}

async function lookupById(id: string) {
  const url = new URL("https://itunes.apple.com/lookup");
  url.searchParams.set("id", id);
  url.searchParams.set("country", "jp");
  url.searchParams.set("entity", "software");
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error(`Apple lookup failed: ${response.status}`);
  return (await response.json()) as ITunesLookupResponse;
}

async function searchByTerm(term: string) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", term);
  url.searchParams.set("country", "jp");
  url.searchParams.set("entity", "software");
  url.searchParams.set("limit", "1");
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error(`Apple search failed: ${response.status}`);
  return (await response.json()) as ITunesLookupResponse;
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();

  try {
    const body = (await request.json()) as { query?: string };
    const query = body.query?.trim() ?? "";
    if (!query) return NextResponse.json({ error: "Missing App Store link or app id." }, { status: 400 });

    const appId = extractAppStoreId(query);
    const data = appId ? await lookupById(appId) : await searchByTerm(query);
    const item = data.results[0];
    if (!item?.trackName || !item.trackViewUrl) return NextResponse.json({ error: "App not found." }, { status: 404 });

    return NextResponse.json({
      item: {
        app_store_id: item.trackId ? String(item.trackId) : appId,
        app_url: item.trackViewUrl,
        category: mapCategory(item.primaryGenreName ?? item.genres?.[0]),
        description: "",
        image_url: item.artworkUrl512 ?? item.artworkUrl100 ?? "",
        status: "draft",
        title: item.trackName,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch App Store data." }, { status: 500 });
  }
}
