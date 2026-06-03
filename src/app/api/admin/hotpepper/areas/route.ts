import { NextResponse, type NextRequest } from "next/server";
import { adminErrorResponse, invalidAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";

const middleAreaEndpoint = "https://webservice.recruit.co.jp/hotpepper/middle_area/v1/";
const smallAreaEndpoint = "https://webservice.recruit.co.jp/hotpepper/small_area/v1/";
const tokyoLargeAreaCode = "Z011";

type AreaOption = {
  code: string;
  name: string;
};

function getPassword(request: NextRequest) {
  return request.headers.get("x-admin-password") ?? "";
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAreas(value: unknown): AreaOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return { code: textValue(record.code), name: textValue(record.name) };
    })
    .filter((item) => item.code && item.name);
}

async function fetchAreas(url: URL, key: "middle_area" | "small_area") {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return NextResponse.json({ areas: [], error: `HotPepper area API request failed (${response.status}).` }, { status: 502 });

  const payload = (await response.json()) as {
    results?: {
      error?: unknown;
      middle_area?: unknown;
      small_area?: unknown;
    };
  };
  if (payload.results?.error) return NextResponse.json({ areas: [], error: "HotPepper area API returned an error." }, { status: 502 });

  return NextResponse.json({ areas: normalizeAreas(payload.results?.[key]) });
}

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();

  const apiKey = process.env.HOTPEPPER_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ areas: [], error: "HOTPEPPER_API_KEY is missing." }, { status: 500 });

  try {
    const { searchParams } = new URL(request.url);
    const middleArea = searchParams.get("middle_area")?.trim();
    const url = new URL(middleArea ? smallAreaEndpoint : middleAreaEndpoint);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("count", "100");

    if (middleArea) {
      url.searchParams.set("middle_area", middleArea);
      return fetchAreas(url, "small_area");
    }

    url.searchParams.set("large_area", tokyoLargeAreaCode);
    return fetchAreas(url, "middle_area");
  } catch (error) {
    return adminErrorResponse(error);
  }
}
