export type UserFeedbackStatus = "ignored" | "open" | "resolved";

export type UserFeedback = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  page: string;
  type: string;
  message: string;
  pageUrl: string;
  userAgent: string;
  status: UserFeedbackStatus;
};

export type UserFeedbackRow = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  page: string | null;
  type: string | null;
  message: string | null;
  page_url: string | null;
  user_agent: string | null;
  status: UserFeedbackStatus | null;
};

export function mapFeedbackFromDb(row: UserFeedbackRow): UserFeedback {
  return {
    createdAt: row.created_at,
    id: row.id,
    message: row.message ?? "",
    page: row.page ?? "",
    pageUrl: row.page_url ?? "",
    status: row.status ?? "open",
    type: row.type ?? "其他",
    updatedAt: row.updated_at ?? undefined,
    userAgent: row.user_agent ?? "",
  };
}

export function mapFeedbackToDb(input: Pick<UserFeedback, "message" | "page" | "pageUrl" | "type" | "userAgent">) {
  return {
    message: input.message,
    page: input.page,
    page_url: input.pageUrl,
    type: input.type,
    user_agent: input.userAgent,
  };
}
