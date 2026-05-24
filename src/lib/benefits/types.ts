export type BenefitStatus = "draft" | "published" | "archived";

export type BenefitRecord = {
  id: string;
  title: string;
  summary: string | null;
  source_url: string;
  source_name: string | null;
  area: string | null;
  ward: string | null;
  category: string | null;
  target_people: string | null;
  deadline: string | null;
  apply_url: string | null;
  translated_title: string | null;
  translated_summary: string | null;
  translation_provider: "deepl" | "openai" | "original" | null;
  translation_error: string | null;
  translated_at: string | null;
  status: BenefitStatus;
  created_at: string;
  updated_at: string;
};

export type BenefitWritePayload = Partial<Pick<BenefitRecord, "title" | "summary" | "area" | "ward" | "category" | "target_people" | "deadline" | "apply_url" | "translated_title" | "translated_summary" | "translation_provider" | "translation_error" | "translated_at" | "status">>;
