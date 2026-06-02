import {
  createNotification,
  readCommunityNotifications,
} from "@/lib/community/repository";
import type { CommunityLocale } from "@/lib/community/types";

export async function addCommunityFollowNotification(input: {
  communityLocale?: CommunityLocale;
  followedUserId: string;
  followerId: string;
  followerName: string;
}) {
  if (!input.followedUserId || !input.followerId || input.followedUserId === input.followerId) return;

  const exists = readCommunityNotifications().some((notification) => (
    notification.userId === input.followedUserId &&
    notification.targetType === "user" &&
    notification.targetId === input.followerId &&
    notification.title.includes("关注")
  ));
  if (exists) return;

  await createNotification({
    communityLocale: input.communityLocale ?? "zh-cn",
    message: `${input.followerName || "Japan Life 用户"} 关注了你`,
    targetId: input.followerId,
    targetType: "user",
    title: "有人关注了你",
    type: "system",
    userId: input.followedUserId,
  });
}
