import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "./useChatStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      // Auth token bhej sakte hain handshake me agar backend verify kare
      auth: { token: localStorage.getItem("token") },
    });

    newSocket.on("connect", () => {
      // console.log("🟢 Socket Connected:", newSocket.id);
      set({ isConnected: true });
    });

    newSocket.on("disconnect", () => {
      // console.log("🔴 Socket Disconnected");
      set({ isConnected: false });
    });

    // Global Listeners setup karein
    newSocket.on("receive_message", (message) => {
      const { activeConversation, addMessage } = useChatStore.getState();

      // Agar message current active chat ka hai, tabhi add karo
      if (
        activeConversation &&
        message.conversationId === activeConversation.id
      ) {
        addMessage(message);
      }
    });

    newSocket.on("message_deleted", ({ messageId }) => {
      useChatStore.getState().updateMessage(messageId, {
        isDeleted: true,
        content: "🚫 This message was deleted",
      });
    });

    // 3. Message Edited
    newSocket.on("message_edited", (updatedMsg) => {
      useChatStore.getState().updateMessage(updatedMsg.id, {
        content: updatedMsg.content,
        isEdited: true,
      });
    });

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
