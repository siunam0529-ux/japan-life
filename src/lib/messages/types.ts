export type MessageConversation = {
  createdAt: string;
  id: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageSenderId: string;
  participantAId: string;
  participantAName: string;
  participantBId: string;
  participantBName: string;
  updatedAt: string;
};

export type MessageItem = {
  body: string;
  conversationId: string;
  createdAt: string;
  id: string;
  readAt: string | null;
  receiverId: string;
  senderId: string;
};

export type MessageReportReason = "harassment" | "spam" | "inappropriate" | "other";

export type MessageReport = {
  conversationId: string;
  createdAt: string;
  detail: string;
  id: string;
  reason: MessageReportReason;
  reportedUserId: string;
  reporterId: string;
  status: "open";
};

export type ConversationListItem = MessageConversation & {
  isOfficial?: boolean;
  otherUserAvatar?: string;
  otherUserId: string;
  otherUserName: string;
  unreadCount: number;
};
