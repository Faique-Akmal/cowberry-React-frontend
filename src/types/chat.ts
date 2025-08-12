export interface ChatMessage {
  type?: string;
  id: number;
  sender: number;
  sender_username: string;
  recipient: number | null;
  group: number | null;
  group_name: string;
  content: string;
  parent?: number | null;
  replies?: ChatMessage[];
  sent_at: string;
  is_edited?: boolean;
  is_read?: boolean;
  read_at?: null;
  is_deleted?: boolean;
}

export interface ActiveChatInfo {
  chatId: number | null;
  chatType: "group" | "personal" | null;
  chatName?: string;
}