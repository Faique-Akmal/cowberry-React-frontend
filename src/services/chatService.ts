import {
  Conversation,
  Message,
  CreateGroupPayload,
  UpdateGroupPayload,
} from "../types/chatTypes";
import API from "../api/axios";

export const ChatService = {
  // 1. Get All Conversations (Sidebar ke liye)
  getConversations: async (): Promise<Conversation[]> => {
    const response = await API.get("/chat/conversations");
    return response.data;
  },

  // 2. Start Personal Chat
  startPersonalChat: async (receiverId: number): Promise<Conversation> => {
    const response = await API.post("/chat/start", { receiverId });
    return response.data;
  },

  // 3. Create Group Chat (Admin Only)
  createGroup: async (
    payload: CreateGroupPayload
  ): Promise<{ message: string; group: Conversation }> => {
    const response = await API.post("/chat/group/create", payload);
    return response.data;
  },

  // 4. Update Group (Add/Remove members, Rename)
  updateGroup: async (
    groupId: number,
    payload: UpdateGroupPayload
  ): Promise<{ message: string; group: Conversation }> => {
    const response = await API.put(`/chat/group/${groupId}`, payload);
    return response.data;
  },

  // 5. Delete Group
  deleteGroup: async (groupId: number): Promise<void> => {
    await API.delete(`/chat/group/${groupId}`);
  },

  // 6. Get Messages
  getMessages: async (
    conversationId: number,
    page: number = 1
  ): Promise<Message[]> => {
    const response = await API.get(
      `/chat/${conversationId}/messages?page=${page}`
    );
    return response.data;
  },

  // 7. Upload File
  uploadFile: async (
    file: File
  ): Promise<{ fileUrl: string; type: string; filename: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await API.post("/chat/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 8. Get All Users (For creating new chats)
  getAllUsers: async () => {
    const response = await API.get("/users");
    return response.data;
  },
};
