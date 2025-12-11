export interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  email: string;
}

export interface Message {
  id: number;
  content: string | null;
  type: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
  fileUrl?: string;
  senderId: number;
  conversationId: number;
  replyToId?: number;
  createdAt: string;
  sender: User;
  replyTo?: Message; // For nested replies
  isDeleted: boolean;
  isEdited: boolean;
}

export interface Conversation {
  id: number;
  type: "PERSONAL" | "GROUP";
  name?: string;
  participants: {
    user: User;
  }[];
  messages?: Message[];
}

// Socket Payload Types
export interface SendMessagePayload {
  conversationId: number;
  senderId: number;
  content: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
  fileUrl?: string;
  replyToId?: number;
}
