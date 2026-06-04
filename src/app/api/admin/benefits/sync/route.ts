import { NextResponse, type NextRequest } from "next/server";
import { fetchTokyoBenefitDrafts } from "@/lib/benefits/rss";
import { organizeBenefitText } from "@/lib/benefits/organize";
import { translateBenefitText } from "@/lib/benefits/translate";
import { adminErrorResponse, invalidAdminResponse, missingSupabaseAdminResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";
import type { FetchedBenefitDraft } from "@/lib/benefits/rss";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function saveBenefit(item: FetchedBenefitDraft & Record<string, unknown>) {
  return supabaseAdmin!.from("benefits").insert(item);
}

async function publishExistingBenefit(sourceUrl: string, payload: Record<string, unknown>) {
  return supabaseAdmin!
    .from("benefits")
    .update({
      translated_title: payload.translated_title,
      translated_summary: payload.translated_summary,
      translation_provider: payload.translation_provider,
      translation_error: payload.translation_error,
      translated_at: payload.translated_at,
      category: payload.category,
      target_people: payload.target_people,
      status: "published",
    })
    .eq("source_url", sourceUrl)
    .neq("status", "published");
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

function benefitsAutoPublishLocale() {
  return process.env.BENEFITS_AUTO_PUBLISH_LOCALE?.trim() || "ja";
}

function benefitsAutoTranslateEnabled() {
  return benefitsAutoPublishLocale() !== "ja";
}

function shouldAutoPublishBenefit(draft: FetchedBenefitDraft, sourceType?: string) {
  if (benefitsAutoPublishEnabled()) return true;
  if (!benefitsAutoPublishNationalEnabled()) return false;
  return sourceType === "national" || sourceType === "tokyo";
}

function hasVerifiedTranslation(payload: Record<string, unknown>) {
  const provider = payload.translation_provider;
  return Boolean(
    (provider === "deepl" || provider === "openai") &&
      typeof payload.translated_title === "string" &&
      payload.translated_title.trim() &&
      typeof payload.translated_summary === "string" &&
      payload.translated_summary.trim(),
  );
}

function verifyCronRequest(request: NextRequest) {
  if (verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return true;
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

function invalidCronResponse() {
  return NextResponse.json(
    {
      error: "Invalid cron authorization.",
      message: "Set CRON_SECRET in Vercel so Vercel Cron can send Authorization: Bearer <CRON_SECRET>.",
    },
    { status: 401 },
  );
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
    let heldForTranslation = 0;
    const sourceMap = new Map(sourceResults.map((source) => [source.name, source]));
    const shouldTranslatePublishedItems = benefitsAutoTranslateEnabled();

    for (const draft of drafts) {
      const sourceResult = sourceMap.get(draft.source_name);
      const publishCandidate = shouldAutoPublishBenefit(draft, sourceResult?.type);
      const payload: FetchedBenefitDraft & Record<string, unknown> = { ...draft, status: "draft" };

      if (publishCandidate && shouldTranslatePublishedItems) {
        try {
          const translation = await translateBenefitText({ title: draft.title, summary: draft.summary });
          Object.assign(payload, translation);
          if (translation.translation_provider !== "original") translated += 1;
        } catch (error) {
          if (sourceResult) sourceResult.error = [sourceResult.error, error instanceof Error ? error.message : String(error)].filter(Boolean).join(" / ");
        }
      }

      if (benefitsAutoOrganizeEnabled() && publishCandidate && shouldTranslatePublishedItems) {
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

      const readyToPublish = publishCandidate && (!shouldTranslatePublishedItems || hasVerifiedTranslation(payload));

      if (readyToPublish) {
        payload.status = "published";
      } else if (publishCandidate) {
        payload.status = "draft";
        heldForTranslation += 1;
        if (sourceResult) {
          sourceResult.error = [sourceResult.error, "Auto publish paused: translation is required before publishing.", payload.translation_error].filter(Boolean).join(" / ");
        }
      }

      const { error } = await saveBenefit(payload);
      if (!error) {
        added += 1;
        if (sourceResult) sourceResult.added += 1;
        if (readyToPublish) autoPublished += 1;
        continue;
      }
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "23505") {
        skipped += 1;
        if (sourceResult) sourceResult.skipped += 1;
        if (readyToPublish) {
          const { error: updateError } = await publishExistingBenefit(draft.source_url, payload);
          if (!updateError) {
            autoPublished += 1;
          } else if (sourceResult) {
            sourceResult.error = [sourceResult.error, updateError.message].filter(Boolean).join(" / ");
          }
        }
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
      autoPublishedScope: benefitsAutoPublishEnabled() ? "all" : benefitsAutoPublishNationalEnabled() ? "national+tokyo" : "none",
      autoPublishedLocale: benefitsAutoPublishLocale(),
      autoTranslatedPublishedItems: shouldTranslatePublishedItems,
      autoPublishedCount: autoPublished,
      heldForTranslation,
      sources: sourceResults,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) return invalidCronResponse();
  return runBenefitsSync();
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();
  return runBenefitsSync();
}
