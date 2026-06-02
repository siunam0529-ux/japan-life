export const communityReactionChangeEvent = "japan-life:community-reaction-change";

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
