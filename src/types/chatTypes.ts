export interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  email: string;
  role?: {
    id?: number;
    name?: string;
  };
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

export interface ConversationParticipant {
  userId: number;
  user: User;
}

export interface Conversation {
  id: number;
  type: "PERSONAL" | "GROUP";
  name?: string; // Group name
  participants: ConversationParticipant[];
  messages?: Message[];
  updatedAt: string; // Sorting ke liye
}

export interface CreateGroupPayload {
  name: string;
  participantIds: number[];
}

export interface UpdateGroupPayload {
  name?: string;
  addParticipants?: number[];
  removeParticipants?: number[];
}

export interface SendMessagePayload {
  conversationId: number;
  senderId: number;
  content: string;
  type: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
  fileUrl?: string;
  replyToId?: number;
}
