import * as cheerio from "cheerio";
import { BENEFIT_KEYWORDS, BENEFIT_SOURCES, detectBenefitCategory, detectTokyoWard, type BenefitSource } from "@/lib/benefits/config";

export type FetchedBenefitDraft = {
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  area: string;
  ward: string;
  category: string;
  target_people: string;
  deadline: string;
  apply_url: string;
  status: "draft" | "published";
};

export type SourceSyncResult = {
  name: string;
  ward: string;
  mode: "rss" | "fallback" | "skipped";
  rssConfigured: boolean;
  fallbackExecuted: boolean;
  fetched: number;
  matched: number;
  added: number;
  skipped: number;
  error: string;
  note: string;
};

type RawBenefitItem = {
  title: string;
  description: string;
  source_url: string;
};

const maxItemsPerSource = 30;
const timeoutMs = 10_000;

function userAgent() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://japan-life.vercel.app";
  return `JapanLifeBot/1.0 (+${siteUrl})`;
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": userAgent() },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getTagValue(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeHtml(match[1]) : "";
}

function normalizeUrl(url: string, baseUrl: string) {
  return new URL(url, baseUrl).toString();
}

function isAllowedFallbackUrl(href: string, source: BenefitSource) {
  try {
    if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(href)) return false;
    const absolute = normalizeUrl(href, source.fallbackUrl);
    const url = new URL(absolute);
    const sourceHost = new URL(source.fallbackUrl).hostname;
    if (url.hostname !== sourceHost) return false;
    if (/\.(css|js|png|jpe?g|gif|webp|svg|ico|zip|mp4|mp3|mov|avi|wmv|xlsx?|docx?|pptx?)$/i.test(url.pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function fetchRssSource(source: BenefitSource): Promise<RawBenefitItem[]> {
  if (!source.rssUrl) return [];
  const xml = await fetchText(source.rssUrl);
  const itemMatches = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);
  const entryMatches = [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);
  const rssItems = (itemMatches.length > 0 ? itemMatches : entryMatches).slice(0, maxItemsPerSource);
  return rssItems
    .map((item) => {
      const atomLink = item.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] ?? "";
      const link = getTagValue(item, "link") || atomLink;
      return {
        title: getTagValue(item, "title"),
        description: getTagValue(item, "description") || getTagValue(item, "summary") || getTagValue(item, "content"),
        source_url: link ? normalizeUrl(link, source.fallbackUrl) : "",
      };
    })
    .filter((item) => item.title && item.source_url);
}

export async function fetchFallbackPage(source: BenefitSource): Promise<RawBenefitItem[]> {
  const html = await fetchText(source.fallbackUrl);
  const $ = cheerio.load(html);
  const items: RawBenefitItem[] = [];
  const seen = new Set<string>();
  const selectors = [
    "article a",
    "li a",
    ".news a",
    ".topics a",
    ".notice a",
    ".pickup a",
    "[class*='news'] a",
    "[class*='topics'] a",
    "[class*='notice'] a",
    "[class*='pickup'] a",
    "[id*='news'] a",
    "[id*='topics'] a",
    "[id*='notice'] a",
    "main a",
    "a",
  ];

  const collect = (_: number, element: unknown) => {
    if (items.length >= maxItemsPerSource) return;
    const node = element as Parameters<typeof $>[0];
    const link = $(node);
    const title = decodeHtml(link.text() || link.attr("title") || link.attr("aria-label") || "");
    const href = link.attr("href") ?? "";
    if (title.length < 8 || !isAllowedFallbackUrl(href, source)) return;
    const sourceUrl = normalizeUrl(href, source.fallbackUrl);
    if (seen.has(sourceUrl)) return;
    seen.add(sourceUrl);
    const containerText = decodeHtml(link.closest("article, li, .news, .topics, .notice, .pickup, main").text());
    const description = containerText && containerText !== title ? containerText.slice(0, 240) : "";
    items.push({ title, description, source_url: sourceUrl });
  };

  for (const selector of selectors) {
    if (items.length >= maxItemsPerSource) break;
    $(selector).each(collect);
  }

  return items;
}

export function matchBenefitKeywords(item: RawBenefitItem) {
  const text = `${item.title} ${item.description}`;
  return BENEFIT_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function detectCategory(item: RawBenefitItem) {
  return detectBenefitCategory(`${item.title} ${item.description}`);
}

function detectTarget(value: string) {
  const targets = ["子育て世帯", "低所得世帯", "住民税非課税世帯", "外国人", "留学生", "高齢者", "妊娠中の方", "ひとり親世帯"];
  return targets.find((target) => value.includes(target)) ?? "";
}

export function normalizeItem(item: RawBenefitItem, source: BenefitSource): FetchedBenefitDraft {
  const combined = `${item.title} ${item.description}`;
  const summary = decodeHtml(item.description);
  return {
    title: item.title,
    summary: summary.length > 180 ? `${summary.slice(0, 180)}...` : summary,
    source_url: item.source_url,
    source_name: source.name,
    area: "東京都",
    ward: detectTokyoWard(combined, source.ward),
    category: detectCategory(item),
    target_people: detectTarget(combined),
    deadline: "",
    apply_url: item.source_url,
    status: "draft",
  };
}

export async function fetchTokyoBenefitDrafts() {
  const drafts: FetchedBenefitDraft[] = [];
  const sourceResults: SourceSyncResult[] = [];

  for (const source of BENEFIT_SOURCES) {
    let mode: SourceSyncResult["mode"] = source.rssUrl ? "rss" : "fallback";
    let fallbackExecuted = false;
    let rawItems: RawBenefitItem[] = [];
    let error = "";
    let note = source.rssUrl ? "" : "RSS 未配置，已执行 fallback 页面抓取。";
    try {
      if (source.rssUrl) rawItems = await fetchRssSource(source);
    } catch (nextError) {
      note = `RSS 失败，已尝试 fallback：${nextError instanceof Error ? nextError.message : String(nextError)}`;
      rawItems = [];
    }

    if (rawItems.length === 0) {
      mode = "fallback";
      fallbackExecuted = true;
      try {
        rawItems = await fetchFallbackPage(source);
        error = "";
      } catch (nextError) {
        error = nextError instanceof Error ? nextError.message : String(nextError);
        rawItems = [];
      }
    }

    const matchedItems = rawItems.filter(matchBenefitKeywords);
    matchedItems.forEach((item) => drafts.push(normalizeItem(item, source)));
    sourceResults.push({
      name: source.name,
      ward: source.ward,
      mode,
      rssConfigured: Boolean(source.rssUrl),
      fallbackExecuted,
      fetched: rawItems.length,
      matched: matchedItems.length,
      added: 0,
      skipped: 0,
      error,
      note,
    });
  }

  const seen = new Set<string>();
  return {
    drafts: drafts.filter((draft) => {
      if (seen.has(draft.source_url)) return false;
      seen.add(draft.source_url);
      return true;
    }),
    sourceResults,
  };
}
