// import axios from "axios";
import { Conversation, Message } from "../types/chatTypes";
import API from "../api/axios";

export const ChatService = {
  // Chat start karna ya existing fetch karna
  startChat: async (receiverId: number): Promise<Conversation> => {
    const response = await API.post("/chat/start", { receiverId });
    return response.data;
  },

  // Messages fetch karna
  getMessages: async (
    conversationId: number,
    page: number = 1
  ): Promise<Message[]> => {
    const response = await API.get(
      `/chat/${conversationId}/messages?page=${page}`
    );
    return response.data;
  },

  // Optimized Upload
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

  // Sare users fetch karna (Sidebar ke liye - assuming admin/users route exists)
  getAllUsers: async () => {
    // Is route ko apne backend ke isaab se adjust karein (e.g. /admin/users or /users)
    const response = await API.get("/users");
    return response.data;
  },
};
