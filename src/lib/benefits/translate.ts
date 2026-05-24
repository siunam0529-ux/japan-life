import type { BenefitRecord } from "@/lib/benefits/types";

export type TranslationProvider = "deepl" | "openai" | "original";

export type BenefitTranslation = {
  translated_title: string;
  translated_summary: string;
  translation_provider: TranslationProvider;
  translation_error: string;
  translated_at: string;
};

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function fallbackTranslation(title: string, summary: string, error: string): BenefitTranslation {
  return {
    translated_title: title,
    translated_summary: summary,
    translation_provider: "original",
    translation_error: error,
    translated_at: new Date().toISOString(),
  };
}

async function translateWithDeepL(title: string, summary: string) {
  const apiKey = process.env.DEEPL_API_KEY?.trim();
  if (!apiKey) throw new Error("DEEPL_API_KEY is not configured.");
  const endpoint = apiKey.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
  const body = new URLSearchParams();
  body.set("auth_key", apiKey);
  body.append("text", title);
  body.append("text", summary);
  body.set("source_lang", "JA");
  body.set("target_lang", "ZH");
  body.set("formality", "default");

  const response = await fetch(endpoint, { method: "POST", body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.message === "string" ? data.message : `DeepL HTTP ${response.status}`);
  const translations = Array.isArray(data.translations) ? data.translations : [];
  return {
    translated_title: String(translations[0]?.text || title),
    translated_summary: String(translations[1]?.text || summary),
    translation_provider: "deepl" as const,
    translation_error: "",
    translated_at: new Date().toISOString(),
  };
}

async function translateWithOpenAI(title: string, summary: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      input: [
        {
          content: [
            {
              text: [
                "请把下面日本行政/福利信息从日文翻译成自然、准确的简体中文。",
                "要求：不要添加原文没有的信息；不要太长；保留行政和福利用语准确性。",
                "只返回 JSON，格式为 {\"title\":\"...\",\"summary\":\"...\"}。",
                `标题：${title}`,
                `摘要：${summary}`,
              ].join("\n"),
              type: "input_text",
            },
          ],
          role: "user",
        },
      ],
      model: "gpt-4.1-mini",
      text: { format: { type: "json_object" } },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error?.message === "string" ? data.error.message : `OpenAI HTTP ${response.status}`);
  const outputText = String(data.output_text || data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((item: { text?: string }) => item.text ?? "").join("") || "");
  const parsed = JSON.parse(outputText) as { title?: string; summary?: string };
  return {
    translated_title: parsed.title || title,
    translated_summary: parsed.summary || summary,
    translation_provider: "openai" as const,
    translation_error: "",
    translated_at: new Date().toISOString(),
  };
}

export async function translateBenefitText({ summary, title }: { summary: string; title: string }): Promise<BenefitTranslation> {
  const errors: string[] = [];
  try {
    return await translateWithDeepL(title, summary);
  } catch (error) {
    errors.push(`DeepL: ${normalizeError(error)}`);
  }

  try {
    return await translateWithOpenAI(title, summary);
  } catch (error) {
    errors.push(`OpenAI: ${normalizeError(error)}`);
  }

  return fallbackTranslation(title, summary, errors.join(" / "));
}

export function benefitNeedsTranslation(item: Pick<BenefitRecord, "translated_title" | "title">) {
  return !item.translated_title;
}
