export function normalizeAuthEmail(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toLowerCase();
}

export function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered") || normalized.includes("user already")) {
    return "这个邮箱已经注册过，请直接登录。";
  }

  if (normalized.includes("email address") && normalized.includes("invalid")) {
    return "邮箱没有通过验证。请检查是否有隐藏空格、全角符号，或换一个真实邮箱试试。";
  }

  if (normalized.includes("invalid login credentials")) {
    return "邮箱或密码不正确，请检查后再试。";
  }

  if (normalized.includes("email not confirmed")) {
    return "邮箱还没有完成验证，请先打开确认邮件，或稍后再试。";
  }

  if (normalized.includes("password") && (normalized.includes("weak") || normalized.includes("least") || normalized.includes("characters"))) {
    return "密码强度不够，请至少输入 6 位，建议包含字母和数字。";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "操作太频繁，请稍等一会儿再试。";
  }

  return message || "操作失败，请稍后再试。";
}
