const hiddenConversationIdsKey = "japan-life-message-hidden-conversations";
const deletedConversationIdsKey = "japan-life-message-deleted-conversations";
const unreadConversationIdsKey = "japan-life-message-forced-unread-conversations";
const pinnedConversationIdsKey = "japan-life-message-pinned-conversations";
const mutedConversationIdsKey = "japan-life-message-muted-conversations";
const remarkMapKey = "japan-life-message-conversation-remarks";
const userRemarkMapKey = "japan-life-message-user-remarks";
const backgroundMapKey = "japan-life-message-conversation-backgrounds";
const desktopShortcutIdsKey = "japan-life-message-desktop-shortcuts";
const clearedAtMapKey = "japan-life-message-conversation-cleared-at";

export function readHiddenMessageConversationIds() {
  return readIdSet(hiddenConversationIdsKey);
}

export function readDeletedMessageConversationIds() {
  return readIdSet(deletedConversationIdsKey);
}

export function readForcedUnreadMessageConversationIds() {
  return readIdSet(unreadConversationIdsKey);
}

export function readPinnedMessageConversationIds() {
  return readIdSet(pinnedConversationIdsKey);
}

export function readMutedMessageConversationIds() {
  return readIdSet(mutedConversationIdsKey);
}

export function readMessageConversationRemarks() {
  return readStringMap(remarkMapKey);
}

export function readMessageConversationRemark(conversationId: string) {
  return readMessageConversationRemarks()[conversationId]?.trim() || "";
}

export function setMessageConversationRemark(conversationId: string, remark: string) {
  const remarks = readMessageConversationRemarks();
  const nextRemark = remark.trim().slice(0, 24);
  if (nextRemark) remarks[conversationId] = nextRemark;
  else delete remarks[conversationId];
  writeStringMap(remarkMapKey, remarks);
  return nextRemark;
}

export function readMessageUserRemarks() {
  return readStringMap(userRemarkMapKey);
}

export function readMessageUserRemark(userId: string) {
  return readMessageUserRemarks()[userId]?.trim() || "";
}

export function setMessageUserRemark(userId: string, remark: string) {
  const remarks = readMessageUserRemarks();
  const nextRemark = remark.trim().slice(0, 24);
  if (nextRemark) remarks[userId] = nextRemark;
  else delete remarks[userId];
  writeStringMap(userRemarkMapKey, remarks);
  return nextRemark;
}

export function readMessageConversationBackground(conversationId: string) {
  return readStringMap(backgroundMapKey)[conversationId] || "default";
}

export function setMessageConversationBackground(conversationId: string, background: string) {
  const backgrounds = readStringMap(backgroundMapKey);
  if (background === "default") delete backgrounds[conversationId];
  else backgrounds[conversationId] = background;
  writeStringMap(backgroundMapKey, backgrounds);
}

export function readDesktopMessageConversationIds() {
  return readIdSet(desktopShortcutIdsKey);
}

export function setMessageConversationDesktopShortcut(conversationId: string, added: boolean) {
  const ids = readDesktopMessageConversationIds();
  if (added) ids.add(conversationId);
  else ids.delete(conversationId);
  writeIdSet(desktopShortcutIdsKey, ids);
}

export function readMessageConversationClearedAt(conversationId: string) {
  return readStringMap(clearedAtMapKey)[conversationId] || "";
}

export function setMessageConversationClearedAt(conversationId: string, clearedAt: string) {
  const cleared = readStringMap(clearedAtMapKey);
  if (clearedAt) cleared[conversationId] = clearedAt;
  else delete cleared[conversationId];
  writeStringMap(clearedAtMapKey, cleared);
}

export function markMessageConversationUnread(conversationId: string) {
  const unread = readForcedUnreadMessageConversationIds();
  unread.add(conversationId);
  writeIdSet(unreadConversationIdsKey, unread);
}

export function clearForcedMessageConversationUnread(conversationId: string) {
  const unread = readForcedUnreadMessageConversationIds();
  unread.delete(conversationId);
  writeIdSet(unreadConversationIdsKey, unread);
}

export function setMessageConversationPinned(conversationId: string, pinned: boolean) {
  const pinnedIds = readPinnedMessageConversationIds();
  if (pinned) pinnedIds.add(conversationId);
  else pinnedIds.delete(conversationId);
  writeIdSet(pinnedConversationIdsKey, pinnedIds);
}

export function setMessageConversationMuted(conversationId: string, muted: boolean) {
  const mutedIds = readMutedMessageConversationIds();
  if (muted) mutedIds.add(conversationId);
  else mutedIds.delete(conversationId);
  writeIdSet(mutedConversationIdsKey, mutedIds);
}

export function hideMessageConversation(conversationId: string) {
  const hidden = readHiddenMessageConversationIds();
  hidden.add(conversationId);
  writeIdSet(hiddenConversationIdsKey, hidden);
}

export function deleteMessageConversationLocally(conversationId: string) {
  const deleted = readDeletedMessageConversationIds();
  deleted.add(conversationId);
  writeIdSet(deletedConversationIdsKey, deleted);
}

function readIdSet(key: string) {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]") as unknown[];
    return new Set(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return new Set<string>();
  }
}

function writeIdSet(key: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify([...ids].slice(-500)));
}

function readStringMap(key: string) {
  if (typeof window === "undefined") return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "{}") as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
  } catch {
    return {} as Record<string, string>;
  }
}

function writeStringMap(key: string, value: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
