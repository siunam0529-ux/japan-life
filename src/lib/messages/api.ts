import type { User } from "@supabase/supabase-js";
import { readMeProfile } from "@/lib/account/profile";
import { canUseCommunitySupabase, isCommunityLocalMode, shouldUseCommunityLocalFallback } from "@/lib/community/dataMode";
import { removeCommunityRelationship } from "@/lib/community/follow";
import type { ConversationListItem, MessageConversation, MessageItem, MessageReport, MessageReportReason } from "@/lib/messages/types";
import { supabase, supabaseConfigError } from "@/lib/supabase";

export const japanLifeOfficialUserId = "japan-life-official";
const japanLifeOfficialName = "Japan Life Official";
const japanLifeOfficialAvatar = "/images/app-icon.png";
const localMessagesKey = "japan-life-message-local-messages";
const localConversationsKey = "japan-life-message-local-conversations";
const loginRequiredMessage = "Please log in to use private messages.";
const unavailableMessage = "Private messages are unavailable. Check Supabase message tables, RLS, and env vars.";

type MessageSource = "supabase" | "fallback";

type MessageResult<T> = {
  data: T;
  error: string;
  source: MessageSource;
};

type CurrentMessageUser = {
  avatar?: string;
  id: string;
  isMock: boolean;
  name: string;
};

type ConversationRow = {
  created_at: string;
  id: string;
  last_message: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
  participant_a_id: string;
  participant_b_id: string;
  updated_at: string | null;
};

type MessageRow = {
  body: string;
  conversation_id: string;
  created_at: string;
  id: string;
  read_at: string | null;
  receiver_id: string;
  sender_id: string;
};

type MessageProfileRow = {
  avatar?: string | null;
  display_name?: string | null;
  id?: string | null;
};

type MessageProfile = {
  avatar?: string;
  id: string;
  name: string;
};

type BlockStatus = {
  blockedByMe: boolean;
  blockedMe: boolean;
};

type SendOfficialMessageInput = {
  body: string;
  broadcast?: boolean;
  toUserId?: string;
};

function messageResult<T>(data: T, error = "", source: MessageSource = "supabase"): MessageResult<T> {
  return { data, error, source };
}

function fallbackResult<T>(data: T, error = supabaseConfigError || ""): MessageResult<T> {
  return { data, error, source: "fallback" };
}

function shouldFallbackToLocalMessages() {
  return shouldUseCommunityLocalFallback();
}

export function shouldUseRealMessageAuth() {
  return canUseCommunitySupabase();
}

export function isJapanLifeOfficialUser(userId: string) {
  return userId === japanLifeOfficialUserId;
}

export async function getCurrentMessageUser(): Promise<CurrentMessageUser> {
  const user = await getSupabaseUser();
  if (user) {
    const profile = readMeProfile(user);
    return {
      avatar: profile.avatar,
      id: user.id,
      isMock: false,
      name: profile.displayName || getUserDisplayName(user),
    };
  }

  if (shouldUseRealMessageAuth()) {
    return { id: "", isMock: true, name: "" };
  }

  const profile = readMeProfile(null);
  return {
    avatar: profile.avatar,
    id: profile.accountId || profile.publicId || "local-user",
    isMock: false,
    name: profile.displayName || "Japan Life User",
  };
}

export async function listMyConversations(): Promise<MessageResult<ConversationListItem[]>> {
  const user = await getCurrentMessageUser();
  if (shouldUseRealMessageAuth() && user.isMock) return messageResult<ConversationListItem[]>([], loginRequiredMessage);
  if (!supabase || !canUseCommunitySupabase()) {
    if (!shouldFallbackToLocalMessages()) return messageResult<ConversationListItem[]>([], supabaseConfigError || unavailableMessage);
    return fallbackResult(getLocalConversationItems(user.id));
  }

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("id,participant_a_id,participant_b_id,last_message,last_message_at,last_message_sender_id,created_at,updated_at")
      .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as ConversationRow[];
    const conversationIds = rows.map((row) => row.id);
    const participantIds = [...new Set(rows.flatMap((row) => [row.participant_a_id, row.participant_b_id]))];
    const [profiles, unreadCounts] = await Promise.all([
      getMessageProfiles(participantIds),
      getUnreadCounts(conversationIds, user.id),
    ]);

    return messageResult(rows.map((row) => mapConversationRow(row, user.id, profiles, unreadCounts)));
  } catch (error) {
    console.warn("[messages] list conversations", error);
    if (!shouldFallbackToLocalMessages()) return messageResult<ConversationListItem[]>([], getErrorMessage(error) || unavailableMessage);
    return fallbackResult(getLocalConversationItems(user.id), getErrorMessage(error));
  }
}

export async function getConversation(conversationId: string): Promise<MessageResult<ConversationListItem | null>> {
  const user = await getCurrentMessageUser();
  if (shouldUseRealMessageAuth() && user.isMock) return messageResult<ConversationListItem | null>(null, loginRequiredMessage);
  if (!supabase || !canUseCommunitySupabase()) {
    if (!shouldFallbackToLocalMessages()) return messageResult<ConversationListItem | null>(null, supabaseConfigError || unavailableMessage);
    return fallbackResult(getLocalConversationItems(user.id).find((item) => item.id === conversationId) ?? null);
  }

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("id,participant_a_id,participant_b_id,last_message,last_message_at,last_message_sender_id,created_at,updated_at")
      .eq("id", conversationId)
      .maybeSingle();
    if (error) throw error;
    const row = data as ConversationRow | null;
    if (!row || !isConversationParticipant(row, user.id)) return messageResult<ConversationListItem | null>(null);
    const participantIds = [row.participant_a_id, row.participant_b_id];
    const [profiles, unreadCounts] = await Promise.all([
      getMessageProfiles(participantIds),
      getUnreadCounts([row.id], user.id),
    ]);
    return messageResult(mapConversationRow(row, user.id, profiles, unreadCounts));
  } catch (error) {
    console.warn("[messages] get conversation", error);
    return messageResult<ConversationListItem | null>(null, getErrorMessage(error) || unavailableMessage);
  }
}

export async function getOrCreateConversation(otherUserId: string, otherUserName = ""): Promise<MessageResult<ConversationListItem | null>> {
  const user = await getCurrentMessageUser();
  if (shouldUseRealMessageAuth() && user.isMock) return messageResult<ConversationListItem | null>(null, loginRequiredMessage);
  const resolvedOtherUserId = await resolveMessageAccountId(otherUserId);
  if (!resolvedOtherUserId || resolvedOtherUserId === user.id) return messageResult<ConversationListItem | null>(null, "Invalid message recipient.");

  if (!supabase || !canUseCommunitySupabase()) {
    if (!shouldFallbackToLocalMessages()) return messageResult<ConversationListItem | null>(null, supabaseConfigError || unavailableMessage);
    const conversation = upsertLocalConversation(user.id, user.name, resolvedOtherUserId, otherUserName);
    return fallbackResult(conversation);
  }

  try {
    const [participantAId, participantBId] = sortParticipants(user.id, resolvedOtherUserId);
    const existing = await supabase
      .from("conversations")
      .select("id,participant_a_id,participant_b_id,last_message,last_message_at,last_message_sender_id,created_at,updated_at")
      .eq("participant_a_id", participantAId)
      .eq("participant_b_id", participantBId)
      .maybeSingle();
    if (existing.error) throw existing.error;

    const now = new Date().toISOString();
    const row = existing.data as ConversationRow | null;
    const conversation = row ?? await insertConversation(participantAId, participantBId, now);
    const profiles = await getMessageProfiles([participantAId, participantBId]);
    if (otherUserName && !profiles[resolvedOtherUserId]) {
      profiles[resolvedOtherUserId] = { id: resolvedOtherUserId, name: otherUserName };
    }
    return messageResult(mapConversationRow(conversation, user.id, profiles, {}));
  } catch (error) {
    console.warn("[messages] get or create conversation", error);
    return messageResult<ConversationListItem | null>(null, getErrorMessage(error) || unavailableMessage);
  }
}

export async function listMessages(conversationId: string): Promise<MessageResult<MessageItem[]>> {
  const user = await getCurrentMessageUser();
  if (shouldUseRealMessageAuth() && user.isMock) return messageResult<MessageItem[]>([], loginRequiredMessage);
  if (!supabase || !canUseCommunitySupabase()) {
    if (!shouldFallbackToLocalMessages()) return messageResult<MessageItem[]>([], supabaseConfigError || unavailableMessage);
    return fallbackResult(getLocalMessages().filter((message) => message.conversationId === conversationId));
  }

  try {
    const conversation = await getConversation(conversationId);
    if (!conversation.data) return messageResult<MessageItem[]>([], conversation.error);
    const { data, error } = await supabase
      .from("messages")
      .select("id,conversation_id,sender_id,receiver_id,body,created_at,read_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return messageResult(((data ?? []) as MessageRow[]).map(mapMessageRow));
  } catch (error) {
    console.warn("[messages] list messages", error);
    return messageResult<MessageItem[]>([], getErrorMessage(error) || unavailableMessage);
  }
}

export async function sendMessage(conversationId: string, body: string): Promise<MessageResult<MessageItem | null>> {
  const cleanBody = body.trim();
  if (!cleanBody) return messageResult<MessageItem | null>(null, "Message body is empty.");
  const user = await getCurrentMessageUser();
  if (shouldUseRealMessageAuth() && user.isMock) return messageResult<MessageItem | null>(null, loginRequiredMessage);

  if (!supabase || !canUseCommunitySupabase()) {
    if (!shouldFallbackToLocalMessages()) return messageResult<MessageItem | null>(null, supabaseConfigError || unavailableMessage);
    const conversation = getLocalConversationItems(user.id).find((item) => item.id === conversationId);
    if (!conversation) return fallbackResult<MessageItem | null>(null, "Conversation not found.");
    const message = createLocalMessage(conversationId, user.id, conversation.otherUserId, cleanBody);
    patchLocalConversationLastMessage(conversationId, cleanBody, user.id, message.createdAt);
    return fallbackResult(message);
  }

  try {
    const conversationResult = await getConversation(conversationId);
    const conversation = conversationResult.data;
    if (!conversation) return messageResult<MessageItem | null>(null, conversationResult.error || "Conversation not found.");
    const blockStatus = await checkBlockStatus(conversation.otherUserId);
    if (blockStatus.data?.blockedByMe || blockStatus.data?.blockedMe) return messageResult<MessageItem | null>(null, "Messages are blocked for this user.");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        body: cleanBody,
        conversation_id: conversationId,
        receiver_id: conversation.otherUserId,
        sender_id: user.id,
      })
      .select("id,conversation_id,sender_id,receiver_id,body,created_at,read_at")
      .single();
    if (error) throw error;

    const message = mapMessageRow(data as MessageRow);
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        last_message: cleanBody,
        last_message_at: message.createdAt,
        last_message_sender_id: user.id,
        updated_at: message.createdAt,
      })
      .eq("id", conversationId);
    if (updateError) throw updateError;
    return messageResult(message);
  } catch (error) {
    console.warn("[messages] send message", error);
    return messageResult<MessageItem | null>(null, getErrorMessage(error) || "Failed to send message.");
  }
}

export async function markConversationRead(conversationId: string): Promise<MessageResult<boolean>> {
  const user = await getCurrentMessageUser();
  if (shouldUseRealMessageAuth() && user.isMock) return messageResult(false, loginRequiredMessage);
  if (!supabase || !canUseCommunitySupabase()) {
    if (!shouldFallbackToLocalMessages()) return messageResult(false, supabaseConfigError || unavailableMessage);
    markLocalConversationRead(conversationId, user.id);
    return fallbackResult(true);
  }

  try {
    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("receiver_id", user.id)
      .is("read_at", null);
    if (error) throw error;
    return messageResult(true);
  } catch (error) {
    console.warn("[messages] mark read", error);
    return messageResult(false, getErrorMessage(error));
  }
}

export async function checkBlockStatus(otherUserId: string): Promise<MessageResult<BlockStatus>> {
  const user = await getCurrentMessageUser();
  const emptyStatus = { blockedByMe: false, blockedMe: false };
  if (shouldUseRealMessageAuth() && user.isMock) return messageResult(emptyStatus, loginRequiredMessage);
  if (!supabase || !canUseCommunitySupabase()) {
    if (!shouldFallbackToLocalMessages()) return messageResult(emptyStatus, supabaseConfigError || unavailableMessage);
    return fallbackResult(emptyStatus);
  }

  try {
    const { data, error } = await supabase
      .from("user_blocks")
      .select("blocker_id,blocked_id")
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`);
    if (error) throw error;
    const rows = (data ?? []) as Array<{ blocked_id: string; blocker_id: string }>;
    return messageResult({
      blockedByMe: rows.some((row) => row.blocker_id === user.id && row.blocked_id === otherUserId),
      blockedMe: rows.some((row) => row.blocker_id === otherUserId && row.blocked_id === user.id),
    });
  } catch (error) {
    console.warn("[messages] block status", error);
    return messageResult(emptyStatus, getErrorMessage(error));
  }
}

export async function blockUser(otherUserId: string): Promise<MessageResult<boolean>> {
  const user = await getCurrentMessageUser();
  if (shouldUseRealMessageAuth() && user.isMock) return messageResult(false, loginRequiredMessage);
  if (!supabase || !canUseCommunitySupabase()) {
    if (!shouldFallbackToLocalMessages()) return messageResult(false, supabaseConfigError || unavailableMessage);
    return fallbackResult(true);
  }

  try {
    const { error } = await supabase.from("user_blocks").upsert({
      blocked_id: otherUserId,
      blocker_id: user.id,
    }, { onConflict: "blocker_id,blocked_id" });
    if (error) throw error;
    removeCommunityRelationship(otherUserId);
    return messageResult(true);
  } catch (error) {
    console.warn("[messages] block user", error);
    return messageResult(false, getErrorMessage(error));
  }
}

export async function unblockUser(otherUserId: string): Promise<MessageResult<boolean>> {
  const user = await getCurrentMessageUser();
  if (shouldUseRealMessageAuth() && user.isMock) return messageResult(false, loginRequiredMessage);
  if (!supabase || !canUseCommunitySupabase()) {
    if (!shouldFallbackToLocalMessages()) return messageResult(false, supabaseConfigError || unavailableMessage);
    return fallbackResult(true);
  }

  try {
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", otherUserId);
    if (error) throw error;
    return messageResult(true);
  } catch (error) {
    console.warn("[messages] unblock user", error);
    return messageResult(false, getErrorMessage(error));
  }
}

export async function reportUser(
  reportedUserId: string,
  conversationId: string,
  reason: MessageReportReason,
  detail = "",
): Promise<MessageResult<MessageReport | null>> {
  const user = await getCurrentMessageUser();
  if (shouldUseRealMessageAuth() && user.isMock) return messageResult<MessageReport | null>(null, loginRequiredMessage);
  if (!supabase || !canUseCommunitySupabase()) {
    if (!shouldFallbackToLocalMessages()) return messageResult<MessageReport | null>(null, supabaseConfigError || unavailableMessage);
    const now = new Date().toISOString();
    return fallbackResult({
      conversationId,
      createdAt: now,
      detail,
      id: `local-report-${Date.now()}`,
      reason,
      reportedUserId,
      reporterId: user.id,
      status: "open",
    });
  }

  try {
    const { data, error } = await supabase
      .from("message_reports")
      .insert({
        conversation_id: conversationId,
        detail,
        reason,
        reported_user_id: reportedUserId,
        reporter_id: user.id,
      })
      .select("id,conversation_id,reporter_id,reported_user_id,reason,detail,status,created_at")
      .single();
    if (error) throw error;
    const row = data as {
      conversation_id: string;
      created_at: string;
      detail: string | null;
      id: string;
      reason: MessageReportReason;
      reported_user_id: string;
      reporter_id: string;
      status: "open";
    };
    return messageResult({
      conversationId: row.conversation_id,
      createdAt: row.created_at,
      detail: row.detail ?? "",
      id: row.id,
      reason: row.reason,
      reportedUserId: row.reported_user_id,
      reporterId: row.reporter_id,
      status: "open",
    });
  } catch (error) {
    console.warn("[messages] report user", error);
    return messageResult<MessageReport | null>(null, getErrorMessage(error));
  }
}

export async function sendJapanLifeOfficialMessage(input: SendOfficialMessageInput): Promise<MessageResult<boolean>> {
  const body = input.body.trim();
  if (!body) return messageResult(false, "Message body is empty.");
  const adminPassword = typeof window !== "undefined" ? window.sessionStorage.getItem("japan-life-admin-auth") ?? "" : "";
  try {
    const response = await fetch("/api/admin/official-message", {
      body: JSON.stringify({ body, broadcast: input.broadcast, toUserId: input.toUserId }),
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(payload.error || "Official message failed.");
    return messageResult(true);
  } catch (error) {
    console.warn("[messages] official message", error);
    return messageResult(false, getErrorMessage(error) || "Official message failed.");
  }
}

async function getSupabaseUser(): Promise<User | null> {
  if (!supabase || !canUseCommunitySupabase()) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn("[messages] get user", error);
    return null;
  }
  return data.user ?? null;
}

function getUserDisplayName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | null;
  const candidates = [metadata?.display_name, metadata?.name, metadata?.full_name, user.email?.split("@")[0]];
  return candidates.find((value): value is string => typeof value === "string" && Boolean(value.trim()))?.trim() ?? "Japan Life User";
}

function sortParticipants(left: string, right: string) {
  return [left, right].sort((a, b) => a.localeCompare(b)) as [string, string];
}

function isConversationParticipant(row: ConversationRow, userId: string) {
  return row.participant_a_id === userId || row.participant_b_id === userId;
}

async function insertConversation(participantAId: string, participantBId: string, now: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const inserted = await supabase
    .from("conversations")
    .insert({
      last_message: "",
      last_message_at: now,
      last_message_sender_id: null,
      participant_a_id: participantAId,
      participant_b_id: participantBId,
      updated_at: now,
    })
    .select("id,participant_a_id,participant_b_id,last_message,last_message_at,last_message_sender_id,created_at,updated_at")
    .single();
  if (!inserted.error) return inserted.data as ConversationRow;

  const retry = await supabase
    .from("conversations")
    .select("id,participant_a_id,participant_b_id,last_message,last_message_at,last_message_sender_id,created_at,updated_at")
    .eq("participant_a_id", participantAId)
    .eq("participant_b_id", participantBId)
    .maybeSingle();
  if (retry.error) throw retry.error;
  if (!retry.data) throw inserted.error;
  return retry.data as ConversationRow;
}

async function resolveMessageAccountId(userId: string) {
  const normalized = userId.trim();
  if (!normalized || isJapanLifeOfficialUser(normalized)) return normalized;
  if (!supabase || !canUseCommunitySupabase()) return normalized;
  const profiles = await getMessageProfiles([normalized]);
  return profiles[normalized]?.id || normalized;
}

async function getMessageProfiles(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
  const profiles: Record<string, MessageProfile> = {};
  for (const id of uniqueIds) {
    if (isJapanLifeOfficialUser(id)) {
      profiles[id] = { avatar: japanLifeOfficialAvatar, id, name: japanLifeOfficialName };
    }
  }
  if (!supabase || !canUseCommunitySupabase() || uniqueIds.length === 0) return profiles;

  const columns = "id,display_name,avatar";
  const queries = [
    supabase.from("community_profiles").select(columns).in("id", uniqueIds),
  ];
  const results = await Promise.all(queries);
  for (const result of results) {
    if (result.error) {
      console.warn("[messages] load profiles", result.error);
      continue;
    }
    for (const row of (result.data ?? []) as MessageProfileRow[]) addProfileToMap(profiles, row);
  }
  return profiles;
}

function addProfileToMap(profiles: Record<string, MessageProfile>, row: MessageProfileRow) {
  const accountId = row.id || "";
  if (!accountId) return;
  const profile = {
    avatar: row.avatar || undefined,
    id: accountId,
    name: row.display_name || "Japan Life User",
  };
  for (const key of [row.id].filter((value): value is string => Boolean(value))) {
    profiles[key] = profile;
  }
}

async function getUnreadCounts(conversationIds: string[], currentUserId: string) {
  if (!supabase || conversationIds.length === 0) return {} as Record<string, number>;
  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", conversationIds)
    .eq("receiver_id", currentUserId)
    .is("read_at", null);
  if (error) {
    console.warn("[messages] unread counts", error);
    return {};
  }
  return (data ?? []).reduce<Record<string, number>>((counts, row) => {
    const conversationId = String((row as { conversation_id?: unknown }).conversation_id ?? "");
    if (conversationId) counts[conversationId] = (counts[conversationId] ?? 0) + 1;
    return counts;
  }, {});
}

function mapConversationRow(
  row: ConversationRow,
  currentUserId: string,
  profiles: Record<string, MessageProfile>,
  unreadCounts: Record<string, number>,
): ConversationListItem {
  const otherUserId = row.participant_a_id === currentUserId ? row.participant_b_id : row.participant_a_id;
  const currentProfile = profiles[currentUserId];
  const otherProfile = profiles[otherUserId];
  const participantAName = profiles[row.participant_a_id]?.name || fallbackUserName(row.participant_a_id, currentUserId, currentProfile);
  const participantBName = profiles[row.participant_b_id]?.name || fallbackUserName(row.participant_b_id, currentUserId, currentProfile);
  return {
    createdAt: row.created_at,
    id: row.id,
    isOfficial: isJapanLifeOfficialUser(otherUserId),
    lastMessage: row.last_message || "",
    lastMessageAt: row.last_message_at || row.updated_at || row.created_at,
    lastMessageSenderId: row.last_message_sender_id || "",
    otherUserAvatar: otherProfile?.avatar,
    otherUserId,
    otherUserName: otherProfile?.name || fallbackUserName(otherUserId, currentUserId, currentProfile),
    participantAId: row.participant_a_id,
    participantAName,
    participantBId: row.participant_b_id,
    participantBName,
    unreadCount: unreadCounts[row.id] ?? 0,
    updatedAt: row.updated_at || row.last_message_at || row.created_at,
  };
}

function fallbackUserName(userId: string, currentUserId: string, currentProfile?: MessageProfile) {
  if (isJapanLifeOfficialUser(userId)) return japanLifeOfficialName;
  if (userId === currentUserId) return currentProfile?.name || readMeProfile({ id: currentUserId }).displayName;
  return "Japan Life User";
}

function mapMessageRow(row: MessageRow): MessageItem {
  return {
    body: row.body,
    conversationId: row.conversation_id,
    createdAt: row.created_at,
    id: row.id,
    readAt: row.read_at,
    receiverId: row.receiver_id,
    senderId: row.sender_id,
  };
}

function getLocalConversationItems(currentUserId: string): ConversationListItem[] {
  const conversations = getLocalConversations();
  const messages = getLocalMessages();
  return conversations.map((conversation) => {
    const otherUserId = conversation.participantAId === currentUserId ? conversation.participantBId : conversation.participantAId;
    const unreadCount = messages.filter((message) => message.conversationId === conversation.id && message.receiverId === currentUserId && !message.readAt).length;
    return {
      ...conversation,
      isOfficial: isJapanLifeOfficialUser(otherUserId),
      otherUserAvatar: isJapanLifeOfficialUser(otherUserId) ? japanLifeOfficialAvatar : undefined,
      otherUserId,
      otherUserName: conversation.participantAId === currentUserId ? conversation.participantBName : conversation.participantAName,
      unreadCount,
    };
  });
}

function getLocalConversations(): MessageConversation[] {
  if (!isCommunityLocalMode()) return [];
  return readLocalJson<MessageConversation>(localConversationsKey);
}

function getLocalMessages(): MessageItem[] {
  if (!isCommunityLocalMode()) return [];
  return readLocalJson<MessageItem>(localMessagesKey);
}

function upsertLocalConversation(currentUserId: string, currentUserName: string, otherUserId: string, otherUserName: string) {
  const [participantAId, participantBId] = sortParticipants(currentUserId, otherUserId);
  const conversations = getLocalConversations();
  const existing = conversations.find((item) => item.participantAId === participantAId && item.participantBId === participantBId);
  if (existing) return getLocalConversationItems(currentUserId).find((item) => item.id === existing.id)!;
  const now = new Date().toISOString();
  const conversation: MessageConversation = {
    createdAt: now,
    id: `local-${Date.now()}`,
    lastMessage: "",
    lastMessageAt: now,
    lastMessageSenderId: "",
    participantAId,
    participantAName: participantAId === currentUserId ? currentUserName : otherUserName || "Japan Life User",
    participantBId,
    participantBName: participantBId === currentUserId ? currentUserName : otherUserName || "Japan Life User",
    updatedAt: now,
  };
  writeLocalJson(localConversationsKey, [conversation, ...conversations].slice(0, 100));
  return getLocalConversationItems(currentUserId).find((item) => item.id === conversation.id)!;
}

function createLocalMessage(conversationId: string, senderId: string, receiverId: string, body: string) {
  const message: MessageItem = {
    body,
    conversationId,
    createdAt: new Date().toISOString(),
    id: `local-message-${Date.now()}`,
    readAt: null,
    receiverId,
    senderId,
  };
  writeLocalJson(localMessagesKey, [...getLocalMessages(), message].slice(-500));
  return message;
}

function patchLocalConversationLastMessage(conversationId: string, lastMessage: string, senderId: string, sentAt: string) {
  writeLocalJson(localConversationsKey, getLocalConversations().map((conversation) => (
    conversation.id === conversationId
      ? { ...conversation, lastMessage, lastMessageAt: sentAt, lastMessageSenderId: senderId, updatedAt: sentAt }
      : conversation
  )));
}

function markLocalConversationRead(conversationId: string, receiverId: string) {
  const readAt = new Date().toISOString();
  writeLocalJson(localMessagesKey, getLocalMessages().map((message) => (
    message.conversationId === conversationId && message.receiverId === receiverId && !message.readAt
      ? { ...message, readAt }
      : message
  )));
}

function readLocalJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function writeLocalJson<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}
