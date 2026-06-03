import type { Language } from "@/lib/i18n/translations";

export function normalizeAuthEmail(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toLowerCase();
}

const authErrorCopy = {
  "zh-CN": {
    alreadyRegistered: "这个邮箱已经注册过，请直接登录。",
    invalidEmail: "邮箱没有通过验证。请检查是否有隐藏空格、全角字符，或换一个真实邮箱试试。",
    invalidCredentials: "邮箱或密码不正确，请检查后再试。",
    emailNotConfirmed: "邮箱还没有完成验证，请先打开确认邮件，或稍后再试。",
    weakPassword: "密码强度不够，请至少输入 6 位，建议包含字母和数字。",
    rateLimited: "操作太频繁，请稍等一会儿再试。",
    fallback: "操作失败，请稍后再试。",
  },
  "zh-TW": {
    alreadyRegistered: "這個信箱已經註冊過，請直接登入。",
    invalidEmail: "信箱沒有通過驗證。請檢查是否有隱藏空格、全形字元，或換一個真實信箱試試。",
    invalidCredentials: "信箱或密碼不正確，請檢查後再試。",
    emailNotConfirmed: "信箱還沒有完成驗證，請先打開確認郵件，或稍後再試。",
    weakPassword: "密碼強度不夠，請至少輸入 6 位，建議包含字母和數字。",
    rateLimited: "操作太頻繁，請稍等一會兒再試。",
    fallback: "操作失敗，請稍後再試。",
  },
  ja: {
    alreadyRegistered: "このメールアドレスは登録済みです。ログインしてください。",
    invalidEmail: "メールアドレスを確認できません。空白、全角文字、または別の有効なメールを確認してください。",
    invalidCredentials: "メールアドレスまたはパスワードが正しくありません。",
    emailNotConfirmed: "メール認証が完了していません。確認メールを開いてから再度お試しください。",
    weakPassword: "パスワードが弱すぎます。6文字以上で、文字と数字を含めることをおすすめします。",
    rateLimited: "操作が多すぎます。少し待ってから再度お試しください。",
    fallback: "操作に失敗しました。しばらくしてからもう一度お試しください。",
  },
} as const;

export function getFriendlyAuthError(message: string, language: Language = "zh-CN") {
  const text = authErrorCopy[language];
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("user already")) {
    return text.alreadyRegistered;
  }

  if (normalized.includes("email address") && normalized.includes("invalid")) {
    return text.invalidEmail;
  }

  if (normalized.includes("invalid login credentials")) {
    return text.invalidCredentials;
  }

  if (normalized.includes("email not confirmed")) {
    return text.emailNotConfirmed;
  }

  if (normalized.includes("password") && (normalized.includes("weak") || normalized.includes("least") || normalized.includes("characters"))) {
    return text.weakPassword;
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return text.rateLimited;
  }

  return message || text.fallback;
}
