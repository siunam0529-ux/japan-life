export const communityMaxImages = 6;
export const communityMaxImageBytes = 5 * 1024 * 1024;

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export function validateCommunityImage(file: File) {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".heic") || lowerName.endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif") {
    return "暂时不支持 HEIC 图片，请先转换为 JPG 或 PNG";
  }
  if (!allowedImageTypes.includes(file.type)) return "仅支持 JPG、PNG、WEBP 图片";
  if (file.size > communityMaxImageBytes) return "图片不能超过 5MB";
  return "";
}
