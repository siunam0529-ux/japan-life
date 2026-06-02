import { NextResponse, type NextRequest } from "next/server";
import { fetchTokyoBenefitDrafts } from "@/lib/benefits/rss";
import { organizeBenefitText } from "@/lib/benefits/organize";
import { translateBenefitText } from "@/lib/benefits/translate";
import { adminErrorResponse, invalidAdminResponse, missingSupabaseAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import type { FetchedBenefitDraft } from "@/lib/benefits/rss";

async function saveBenefit(item: FetchedBenefitDraft & Record<string, unknown>) {
  return supabaseAdmin!.from("benefits").insert(item);
}

function benefitsAutoPublishEnabled() {
  return process.env.BENEFITS_AUTO_PUBLISH === "true";
}

function benefitsAutoPublishNationalEnabled() {
  return process.env.BENEFITS_AUTO_PUBLISH_NATIONAL !== "false";
}

function benefitsAutoOrganizeEnabled() {
  return process.env.BENEFITS_AUTO_ORGANIZE !== "false";
}

function shouldAutoPublishBenefit(draft: FetchedBenefitDraft, sourceType?: string) {
  if (benefitsAutoPublishEnabled()) return true;
  return sourceType === "national" && benefitsAutoPublishNationalEnabled();
}

function hasUsableTranslation(payload: Record<string, unknown>) {
  return Boolean(
    typeof payload.translated_title === "string" &&
    payload.translated_title.trim() &&
    typeof payload.translated_summary === "string" &&
    payload.translated_summary.trim() &&
    payload.translation_provider !== "original",
  );
}

function verifyCronRequest(request: NextRequest) {
  if (verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return true;
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

async function runBenefitsSync() {
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const { drafts, sourceResults } = await fetchTokyoBenefitDrafts();
    let added = 0;
    let skipped = 0;
    let translated = 0;
    let organized = 0;
    let autoPublished = 0;
    const sourceMap = new Map(sourceResults.map((source) => [source.name, source]));

    for (const draft of drafts) {
      const sourceResult = sourceMap.get(draft.source_name);
      const publishCandidate = shouldAutoPublishBenefit(draft, sourceResult?.type);
      const payload: FetchedBenefitDraft & Record<string, unknown> = { ...draft, status: "draft" };
      if (publishCandidate || translated < 20) {
        try {
          const translation = await translateBenefitText({ title: draft.title, summary: draft.summary });
          Object.assign(payload, translation);
          if (translation.translation_provider !== "original") translated += 1;
          if (publishCandidate && translation.translation_provider === "original") {
            payload.status = "draft";
            if (sourceResult) {
              sourceResult.error = [sourceResult.error, "自动发布已暂停：翻译失败，已保留为草稿。", translation.translation_error].filter(Boolean).join(" / ");
            }
          }
        } catch (error) {
          if (sourceResult) sourceResult.error = [sourceResult.error, error instanceof Error ? error.message : String(error)].filter(Boolean).join(" / ");
        }
      }
      if (benefitsAutoOrganizeEnabled() && (publishCandidate || organized < 20)) {
        try {
          const organizedText = await organizeBenefitText({
            title: String(payload.translated_title || draft.title),
            summary: String(payload.translated_summary || draft.summary),
            category: draft.category,
            target_people: draft.target_people,
          });
          if (organizedText.summary) payload.translated_summary = organizedText.summary;
          if (organizedText.category) payload.category = organizedText.category;
          if (organizedText.target_people) payload.target_people = organizedText.target_people;
          organized += 1;
        } catch (error) {
          if (sourceResult) sourceResult.error = [sourceResult.error, error instanceof Error ? error.message : String(error)].filter(Boolean).join(" / ");
        }
      }
      if (publishCandidate && hasUsableTranslation(payload)) {
        payload.status = "published";
        autoPublished += 1;
      }
      const { error } = await saveBenefit(payload);
      if (!error) {
        added += 1;
        if (sourceResult) sourceResult.added += 1;
        continue;
      }
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "23505") {
        skipped += 1;
        if (sourceResult) sourceResult.skipped += 1;
        continue;
      }
      if (sourceResult) sourceResult.error = [sourceResult.error, error.message].filter(Boolean).join(" / ");
    }

    if (process.env.NODE_ENV !== "production") {
      sourceResults.forEach((source) => {
        console.log("[benefits-sync]", {
          name: source.name,
          mode: source.mode,
          fallbackExecuted: source.fallbackExecuted,
          fetched: source.fetched,
          skippedNoSummary: source.skippedNoSummary,
          matched: source.matched,
          added: source.added,
          skipped: source.skipped,
        });
      });
    }

    const matched = sourceResults.reduce((sum, source) => sum + source.matched, 0);
    return NextResponse.json({
      added,
      skipped,
      matched,
      translated,
      organized,
      autoPublished: benefitsAutoPublishEnabled(),
      autoPublishedNational: benefitsAutoPublishNationalEnabled(),
      autoPublishedCount: autoPublished,
      sources: sourceResults,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) return invalidAdminResponse();
  return runBenefitsSync();
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();
  return runBenefitsSync();
}
