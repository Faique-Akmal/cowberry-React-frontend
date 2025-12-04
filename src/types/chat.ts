export interface ChatAttachment {
  id: number;
  file: string;       // actual file path
  file_url: string;   // accessible URL
  file_type: string;  // MIME type e.g. "text/csv", "image/jpeg"
}

export interface ChatMessage {
  type?: string;
  id: number;
  sender: number;
  sender_username: string;
  recipient: number | null;
  group: number | null;
  group_name?: string | null;
  content: string;
  message_type: "text" | "file" | "image" | "video" | "location"; // extend as needed
  latitude?: string | null;
  longitude?: string | null;
  parent?: number | null;
  replies?: ChatMessage[];
  attachments?: ChatAttachment[];
  sent_at: string; // ISO 8601 datetime string
  is_read?: boolean;
  read_at?: string | null;
  is_deleted?: boolean;
  is_edited?: boolean;
}

export interface ActiveChatInfo {
  chatId: number | null;
  chatType: "group" | "personal" | null;
  chatName?: string;
}