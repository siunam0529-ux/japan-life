import { NextResponse, type NextRequest } from "next/server";
import {
  adminErrorResponse,
  invalidAdminResponse,
  missingSupabaseAdminResponse,
  verifyAdminPassword,
} from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";

const officialUserId = "japan-life-official";

type ConversationRow = {
  id: string;
  participant_a_id: string;
  participant_b_id: string;
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

function getPassword(request: NextRequest) {
  return request.headers.get("x-admin-password") ?? "";
}

function sortParticipants(left: string, right: string) {
  return [left, right].sort((a, b) => a.localeCompare(b)) as [string, string];
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  const body = (await request.json()) as Record<string, unknown>;
  const toUserId = typeof body.toUserId === "string" ? body.toUserId.trim() : "";
  const messageBody = typeof body.body === "string" ? body.body.trim() : "";
  const broadcast = body.broadcast === true;
  if ((!toUserId && !broadcast) || !messageBody) {
    return NextResponse.json({ error: "Missing official message target or body." }, { status: 400 });
  }

  try {
    if (broadcast) {
      const users = await listBroadcastUserIds();
      const messages: MessageRow[] = [];
      for (const userId of users) {
        const message = await sendOfficialMessage(userId, messageBody);
        messages.push(message);
      }
      return NextResponse.json({ count: messages.length, messages });
    }

    const message = await sendOfficialMessage(toUserId, messageBody);
    return NextResponse.json({ message });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

async function listBroadcastUserIds() {
  if (!supabaseAdmin) return [];
  const authUserIds = await listAuthUserIds();
  const { data, error } = await supabaseAdmin
    .from("community_profiles")
    .select("id")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const profileUserIds = (data ?? [])
    .map((row) => {
      const profile = row as { id?: unknown };
      return String(profile.id ?? "");
    })
    .map((value) => value.trim())
    .filter((value) => value && value !== officialUserId);

  return [...new Set([...authUserIds, ...profileUserIds])];
}

async function listAuthUserIds() {
  if (!supabaseAdmin) return [];
  const userIds: string[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data.users ?? [];
    userIds.push(...users.map((user) => user.id).filter((id) => id && id !== officialUserId));
    if (users.length < perPage) break;
    page += 1;
  }

  return userIds;
}

async function sendOfficialMessage(toUserId: string, body: string) {
  if (!supabaseAdmin) throw new Error("Supabase admin client is not configured.");
  const [participantAId, participantBId] = sortParticipants(officialUserId, toUserId);
  const existing = await supabaseAdmin
    .from("conversations")
    .select("id,participant_a_id,participant_b_id")
    .eq("participant_a_id", participantAId)
    .eq("participant_b_id", participantBId)
    .maybeSingle<ConversationRow>();
  if (existing.error) throw existing.error;

  const now = new Date().toISOString();
  const conversation = existing.data ?? (await createConversation(participantAId, participantBId, now));
  if (!conversation) throw new Error("Failed to create official conversation.");

  const inserted = await supabaseAdmin
    .from("messages")
    .insert({
      body,
      conversation_id: conversation.id,
      receiver_id: toUserId,
      sender_id: officialUserId,
    })
    .select("id,conversation_id,sender_id,receiver_id,body,created_at,read_at")
    .single<MessageRow>();
  if (inserted.error) throw inserted.error;

  const messageTime = inserted.data.created_at || now;
  const updated = await supabaseAdmin
    .from("conversations")
    .update({
      last_message: body,
      last_message_at: messageTime,
      last_message_sender_id: officialUserId,
      updated_at: messageTime,
    })
    .eq("id", conversation.id);
  if (updated.error) throw updated.error;

  return inserted.data;
}

async function createConversation(participantAId: string, participantBId: string, now: string) {
  if (!supabaseAdmin) return null;
  const inserted = await supabaseAdmin
    .from("conversations")
    .insert({
      last_message: "",
      last_message_at: now,
      last_message_sender_id: null,
      participant_a_id: participantAId,
      participant_b_id: participantBId,
      updated_at: now,
    })
    .select("id,participant_a_id,participant_b_id")
    .single<ConversationRow>();
  if (!inserted.error) return inserted.data;

  const retry = await supabaseAdmin
    .from("conversations")
    .select("id,participant_a_id,participant_b_id")
    .eq("participant_a_id", participantAId)
    .eq("participant_b_id", participantBId)
    .maybeSingle<ConversationRow>();
  if (retry.error) throw retry.error;
  return retry.data;
}
