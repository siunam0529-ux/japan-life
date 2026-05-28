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

function benefitsAutoOrganizeEnabled() {
  return process.env.BENEFITS_AUTO_ORGANIZE !== "false";
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request.headers.get("x-admin-password") ?? "")) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const { drafts, sourceResults } = await fetchTokyoBenefitDrafts();
    let added = 0;
    let skipped = 0;
    let translated = 0;
    let organized = 0;
    const sourceMap = new Map(sourceResults.map((source) => [source.name, source]));

    for (const draft of drafts) {
      const payload: FetchedBenefitDraft & Record<string, unknown> = { ...draft, status: benefitsAutoPublishEnabled() ? "published" : "draft" };
      if (translated < 20) {
        try {
          Object.assign(payload, await translateBenefitText({ title: draft.title, summary: draft.summary }));
          translated += 1;
        } catch (error) {
          const sourceResult = sourceMap.get(draft.source_name);
          if (sourceResult) sourceResult.error = [sourceResult.error, error instanceof Error ? error.message : String(error)].filter(Boolean).join(" / ");
        }
      }
      if (benefitsAutoOrganizeEnabled() && organized < 20) {
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
          const sourceResult = sourceMap.get(draft.source_name);
          if (sourceResult) sourceResult.error = [sourceResult.error, error instanceof Error ? error.message : String(error)].filter(Boolean).join(" / ");
        }
      }
      const { error } = await saveBenefit(payload);
      const sourceResult = sourceMap.get(draft.source_name);
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
    return NextResponse.json({ added, skipped, matched, translated, organized, autoPublished: benefitsAutoPublishEnabled(), sources: sourceResults });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
