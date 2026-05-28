const hotpepperOnlyCategoryIds = new Set([
  "bar",
  "beauty",
  "cafe",
  "dessert",
  "drink",
  "food",
  "gourmet",
  "hair",
  "izakaya",
  "ramen",
  "restaurant",
  "salon",
  "sweets",
]);

const hotpepperOnlyPatterns = [
  /餐厅|餐廳|餐饮|餐飲|饭店|飯店|吃喝|饮食|飲食|料理|美食|咖啡|甜品|甜点|甜點|拉面|拉麵|居酒屋|酒吧/,
  /美容|美发|美髮|发廊|髮廊|理发|理髮|沙龙/,
  /飲食店|グルメ|レストラン|カフェ|喫茶|スイーツ|ラーメン|居酒屋|バー/,
  /美容|ヘア|サロン|美容室|理容/,
];

export function isHotpepperOnlyCategory(value: unknown) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (hotpepperOnlyCategoryIds.has(normalized)) return true;
  return hotpepperOnlyPatterns.some((pattern) => pattern.test(value));
}

export function isHotpepperOnlyText(...values: unknown[]): boolean {
  return values.some((value) => {
    if (typeof value === "string") return isHotpepperOnlyCategory(value);
    if (Array.isArray(value)) return isHotpepperOnlyText(...value);
    return false;
  });
}

export function isHotpepperOnlyShopRecord(record: Record<string, unknown>) {
  return isHotpepperOnlyText(
    record.category,
    record.shop_type,
    record.name,
    record.title,
    record.description,
    record.tags,
  );
}
