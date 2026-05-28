import { walkSpots } from "@/lib/walk/spots";
import type { WalkCollection, WalkSpot, WalkTag } from "@/lib/walk/types";
export type { WalkCollection } from "@/lib/walk/types";

export const walkCollections: WalkCollection[] = [
  {
    id: "rainy-walk",
    title: "雨天散步",
    description: "下雨天也能慢慢走的东京小地方",
    emoji: "☔",
    tags: ["下雨天", "咖啡", "室内", "书店"],
    coverImage: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=900&q=80",
    intro: "不想跑太远的时候，找一家咖啡店附近慢慢走。",
  },
  {
    id: "solo-walk",
    title: "一个人散步",
    description: "适合独处、放空和整理心情",
    emoji: "🚶",
    tags: ["一个人", "安静", "想放空"],
    coverImage: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=900&q=80",
    intro: "不需要约人，也不需要计划太多，一个人慢慢走就好。",
  },
  {
    id: "late-night-walk",
    title: "深夜散步",
    description: "短距离、灯光和安全感优先",
    emoji: "🌙",
    tags: ["深夜", "便利店", "拉面店", "短时间"],
    coverImage: "https://images.unsplash.com/photo-1505069446780-4ef442b5207f?auto=format&fit=crop&w=900&q=80",
    intro: "晚上不要走太远，买杯热饮，短短绕一圈就够。",
  },
  {
    id: "showa-walk",
    title: "昭和感散步",
    description: "老招牌、商店街和本地生活感",
    emoji: "🏮",
    tags: ["昭和感", "商店街", "喫茶", "老店"],
    coverImage: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=900&q=80",
    intro: "想看一点不那么新的东京，就去老街和商店街慢慢逛。",
  },
  {
    id: "cat-walk",
    title: "猫咪散步",
    description: "老街、小巷和可能遇见猫的地方",
    emoji: "🐾",
    tags: ["猫", "小巷", "谷根千", "安静", "昭和感"],
    coverImage: "https://images.unsplash.com/photo-1494256997604-768d1f608cac?auto=format&fit=crop&w=900&q=80",
    intro: "今天不赶路，去老街和小巷里碰碰运气。",
  },
  {
    id: "low-budget-walk",
    title: "低预算散步",
    description: "少花钱也能换气的一小时",
    emoji: "¥",
    tags: ["低预算", "公园", "商店街", "便利店"],
    coverImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    intro: "预算不高的时候，公园、河边和商店街也足够让人恢复一点。",
  },
  {
    id: "coffee-walk",
    title: "咖啡散步",
    description: "围绕咖啡店慢慢移动",
    emoji: "☕",
    tags: ["咖啡", "喫茶", "下雨天", "文艺"],
    coverImage: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=900&q=80",
    intro: "先找一家舒服的店，再让附近的小路决定今天的路线。",
  },
  {
    id: "book-walk",
    title: "书店散步",
    description: "旧书、纸张味和慢节奏",
    emoji: "📚",
    tags: ["书店", "文艺", "下雨天", "一个人"],
    coverImage: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80",
    intro: "适合不想说太多话的日子，进书店慢慢翻几页。",
  },
];

export function getWalkCollectionById(collectionId: string | null) {
  if (!collectionId) return null;
  return walkCollections.find((collection) => collection.id === collectionId) ?? null;
}

export function getWalkCollectionTag(collection: WalkCollection): WalkTag | "全部" {
  const tag = collection.tags.find((item): item is WalkTag => ["安静", "文艺", "深夜", "一个人", "下雨天", "昭和感", "小众"].includes(item));
  return tag ?? "全部";
}

export function getWalkCollectionPool(collection: WalkCollection | null) {
  if (!collection) return walkSpots;
  return walkSpots.filter((spot) => matchWalkCollection(spot, collection));
}

function matchWalkCollection(spot: WalkSpot, collection: WalkCollection) {
  const text = [
    spot.station,
    spot.area,
    spot.title,
    spot.subtitle,
    spot.reason,
    spot.walkTask,
    spot.budget,
    spot.difficulty,
    spot.stepsEstimate,
    spot.moodTags.join(" "),
    spot.weatherTags.join(" "),
    spot.suitableFor.join(" "),
  ].join(" ");

  if (collection.id === "cat-walk") {
    return ["谷根千", "阿佐ヶ谷", "荻窪", "中野", "小巷", "老街"].some((keyword) => text.includes(keyword));
  }
  if (collection.id === "low-budget-walk") {
    return spot.budget.includes("¥0") || spot.budget.includes("¥500") || spot.budget.includes("¥600") || spot.suitableFor.includes("低预算");
  }
  return collection.tags.some((tag) => text.includes(tag));
}
