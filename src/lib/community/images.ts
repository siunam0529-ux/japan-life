import type { Language } from "@/lib/i18n/translations";

export const communityMaxImages = 6;
export const communityMaxImageBytes = 5 * 1024 * 1024;

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

const imageCopy = {
  "zh-CN": {
    heic: "暂时不支持 HEIC 图片，请先转换为 JPG 或 PNG",
    type: "仅支持 JPG、PNG、WEBP 图片",
    size: "图片不能超过 5MB",
  },
  "zh-TW": {
    heic: "暫時不支援 HEIC 圖片，請先轉換為 JPG 或 PNG",
    type: "僅支援 JPG、PNG、WEBP 圖片",
    size: "圖片不能超過 5MB",
  },
  ja: {
    heic: "HEIC 画像は現在対応していません。JPG または PNG に変換してください",
    type: "JPG、PNG、WEBP 画像のみ対応しています",
    size: "画像は 5MB 以下にしてください",
  },
} as const;

export function validateCommunityImage(file: File, language: Language = "zh-CN") {
  const text = imageCopy[language];
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".heic") || lowerName.endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif") {
    return text.heic;
  }
  if (!allowedImageTypes.includes(file.type)) return text.type;
  if (file.size > communityMaxImageBytes) return text.size;
  return "";
}
