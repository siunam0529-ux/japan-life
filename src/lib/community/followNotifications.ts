import {
  createNotification,
  readCommunityNotifications,
} from "@/lib/community/repository";
import type { CommunityLocale } from "@/lib/community/types";

function readLanguage() {
  if (typeof window === "undefined") return "zh-CN";
  const value = window.localStorage.getItem("japan-life:language");
  return value === "zh-TW" || value === "ja" ? value : "zh-CN";
}

function followCopy(followerName: string) {
  const language = readLanguage();
  const name = followerName || (language === "ja" ? "Japan Life ユーザー" : "Japan Life 用户");
  if (language === "ja") {
    return {
      keyword: "フォロー",
      message: `${name} さんがあなたをフォローしました`,
      title: "新しいフォローがあります",
    };
  }
  if (language === "zh-TW") {
    return {
      keyword: "關注",
      message: `${name} 關注了你`,
      title: "有人關注了你",
    };
  }
  return {
    keyword: "关注",
    message: `${name} 关注了你`,
    title: "有人关注了你",
  };
}

export async function addCommunityFollowNotification(input: {
  communityLocale?: CommunityLocale;
  followedUserId: string;
  followerId: string;
  followerName: string;
}) {
  if (!input.followedUserId || !input.followerId || input.followedUserId === input.followerId) return;
  const text = followCopy(input.followerName);

  const exists = readCommunityNotifications().some((notification) => (
    notification.userId === input.followedUserId &&
    notification.targetType === "user" &&
    notification.targetId === input.followerId &&
    notification.title.includes(text.keyword)
  ));
  if (exists) return;

  await createNotification({
    communityLocale: input.communityLocale ?? "zh-cn",
    message: text.message,
    targetId: input.followerId,
    targetType: "user",
    title: text.title,
    type: "system",
    userId: input.followedUserId,
  });
}
