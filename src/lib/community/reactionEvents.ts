export const communityReactionChangeEvent = "japan-life:community-reaction-change";
export const communityPostChangeEvent = "japan-life:community-post-change";

export type CommunityReactionChangeDetail = {
  active: boolean;
  count: number;
  postId: string;
  type: "favorite" | "like";
};

export function dispatchCommunityReactionChange(detail: CommunityReactionChangeDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CommunityReactionChangeDetail>(communityReactionChangeEvent, { detail }));
}

export type CommunityPostChangeDetail = {
  postId: string;
  post?: import("@/lib/community/types").CommunityPost;
  status?: import("@/lib/community/types").CommunityPostStatus;
};

export function dispatchCommunityPostChange(detail: CommunityPostChangeDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CommunityPostChangeDetail>(communityPostChangeEvent, { detail }));
}
