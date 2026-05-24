export type BenefitOrganization = {
  title?: string;
  summary?: string;
  category?: string;
  target_people?: string;
};

const categoryHints = ["子育て", "住宅", "外国人・留学生", "医療", "高齢者", "低所得", "仕事", "その他"];

export async function organizeBenefitText(input: { title: string; summary: string; category: string; target_people: string }): Promise<BenefitOrganization> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return {};

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_BENEFIT_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "你只整理日本行政福利信息，不编造事实。输出 JSON，字段为 title, summary, category, target_people。summary 用简体中文，80字以内。",
        },
        {
          role: "user",
          content: JSON.stringify({
            allowedCategories: categoryHints,
            title: input.title,
            summary: input.summary,
            category: input.category,
            target_people: input.target_people,
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || `OpenAI organize ${response.status}`);
  const content = data.choices?.[0]?.message?.content;
  if (!content) return {};
  const parsed = JSON.parse(content) as BenefitOrganization;
  return {
    title: typeof parsed.title === "string" ? parsed.title : undefined,
    summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
    category: categoryHints.includes(String(parsed.category)) ? String(parsed.category) : undefined,
    target_people: typeof parsed.target_people === "string" ? parsed.target_people : undefined,
  };
}
