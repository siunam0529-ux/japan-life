import type { FoodDirection, FoodMoodTag, FoodPreference, FoodRecommendation, FoodSkipRule } from "@/lib/food/types";
import type { FoodContext } from "@/lib/food/recommendationLogic";

export function generateFoodReason(food: FoodRecommendation, context: FoodContext, activeTag: FoodMoodTag | "全部") {
  if (context.weatherMood === "有点冷" && food.moodTags.includes("想吃热的")) {
    return `今天有点冷，${food.name}这种热乎的选择会比较舒服。`;
  }

  if (context.weatherMood === "下雨" && food.moodTags.includes("下雨天")) {
    return `下雨天不想折腾的话，${food.name}会比较省心。`;
  }

  if (context.weatherMood === "有点热" && food.moodTags.includes("想吃清爽的")) {
    return `今天有点热，${food.name}这种清爽一点的选择负担不大。`;
  }

  if (context.timeSlot === "深夜") {
    return `深夜不想跑太远的话，${food.name}比较现实，也不用认真选店。`;
  }

  if (context.timeSlot === "中午") {
    return `现在是中午，${food.name}比较稳，价格也不会太夸张。`;
  }

  if (context.timeSlot === "下午" && food.moodTags.includes("想吃甜的")) {
    return `下午可以给自己一点小休息，${food.name}刚好不会太正式。`;
  }

  if (activeTag !== "全部" && food.moodTags.includes(activeTag)) {
    return `今天偏向「${activeTag}」的话，${food.name}会是一个轻松的选择。`;
  }

  return food.reason;
}

export function generateFoodReasonItems(options: {
  activeTag: FoodMoodTag | "全部";
  context: FoodContext;
  direction?: FoodDirection | null;
  food: FoodRecommendation;
  preferences: FoodPreference[];
  skipRules: FoodSkipRule[];
}) {
  const reasons: string[] = [`现在是${options.context.timeSlot}，${options.context.timeMessage}`];

  if (options.context.weatherMood !== "普通") {
    reasons.push(`今天选择了「${options.context.weatherMood}」，会优先考虑更贴合天气感觉的食物。`);
  } else {
    reasons.push("今天感觉普通，会优先按时间段和心情来推荐。");
  }

  if (options.preferences.length > 0) {
    reasons.push(`你的偏好是「${options.preferences.slice(0, 2).join(" / ")}」，推荐会稍微往这个方向靠。`);
  } else if (options.activeTag !== "全部") {
    reasons.push(`当前心情标签是「${options.activeTag}」，所以会先看这一类食物。`);
  } else if (options.direction) {
    reasons.push(`这次换到「${options.direction}」方向，会从相近选择里重新挑。`);
  } else {
    reasons.push(`${options.food.name}属于比较稳的日常选择，不需要认真做攻略。`);
  }

  if (options.skipRules.length > 0) {
    reasons.push(`今天已避开「${options.skipRules.slice(0, 2).join(" / ")}」。`);
  }

  return reasons.slice(0, 3);
}
