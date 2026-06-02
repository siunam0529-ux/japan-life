import type { CommunityUserProfile } from "@/lib/community/types";

export type CommunityMentionTarget = Pick<CommunityUserProfile, "avatar" | "displayName" | "id">;

const mentionPattern = /(^|[\s([{（【「『])@([^\s@,，.。:：;；!?！？()[\]{}<>《》'"“”‘’]+)/g;

export function normalizeMentionQuery(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function dedupeMentionTargets(users: CommunityMentionTarget[]) {
  const seen = new Set<string>();
  return users.filter((user) => {
    if (!user.id || seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  });
}

export function getActiveMentionQuery(value: string) {
  const match = value.match(/(?:^|\s)@([^\s@]*)$/);
  return match?.[1] ?? null;
}

export function filterMentionTargets(users: CommunityMentionTarget[], query: string, limit = 6) {
  const normalizedQuery = normalizeMentionQuery(query);
  if (!normalizedQuery) return users.slice(0, limit);
  return users
    .filter((user) => {
      const name = user.displayName.toLowerCase();
      const id = user.id.toLowerCase();
      return name.includes(normalizedQuery) || id.includes(normalizedQuery);
    })
    .slice(0, limit);
}

export function insertMentionAtActiveQuery(value: string, user: CommunityMentionTarget) {
  return value.replace(/(?:^|\s)@[^\s@]*$/, (match) => {
    const prefix = match.startsWith(" ") ? " " : "";
    return `${prefix}@${user.displayName} `;
  });
}

export type CommunityMentionTextPart = {
  id?: string;
  text: string;
  type: "text" | "mention";
};

export function parseCommunityMentionText(value: string, users: CommunityMentionTarget[]): CommunityMentionTextPart[] {
  const targets = buildMentionLookup(users);
  const parts: CommunityMentionTextPart[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(mentionPattern)) {
    const fullMatch = match[0];
    const prefix = match[1] ?? "";
    const token = match[2] ?? "";
    const mentionStart = match.index + prefix.length;
    const mentionText = fullMatch.slice(prefix.length);
    const target = targets.get(normalizeMentionQuery(token));

    if (!target) continue;
    if (mentionStart > lastIndex) parts.push({ text: value.slice(lastIndex, mentionStart), type: "text" });
    parts.push({ id: target.id, text: mentionText, type: "mention" });
    lastIndex = mentionStart + mentionText.length;
  }

  if (lastIndex < value.length) parts.push({ text: value.slice(lastIndex), type: "text" });
  return parts.length ? parts : [{ text: value, type: "text" }];
}

function buildMentionLookup(users: CommunityMentionTarget[]) {
  const lookup = new Map<string, CommunityMentionTarget>();
  for (const user of users) {
    lookup.set(normalizeMentionQuery(user.displayName), user);
    lookup.set(normalizeMentionQuery(user.id), user);
  }
  return lookup;
}
