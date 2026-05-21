import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useChatStore } from "./useChatStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

// Incoming call data shape
export interface IncomingCallData {
  from: number;
  callerName: string;
  isVideo: boolean;
  offer: RTCSessionDescriptionInit;
}

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  currentUserId: number | null;
  // ---- Calling state ----
  incomingCall: IncomingCallData | null;
  setIncomingCall: (data: IncomingCallData | null) => void;
  // ---- Methods ----
  connect: () => void;
  disconnect: () => void;
  registerUser: (userId: number) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  currentUserId: null,
  incomingCall: null,

  setIncomingCall: (data) => set({ incomingCall: data }),

  connect: () => {
    const { socket } = get();
    if (socket?.connected) return;

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: localStorage.getItem("token") },
    });

    newSocket.on("connect", () => {
      set({ isConnected: true });

      const { currentUserId } = get();
      if (currentUserId) {
        newSocket.emit("register_user", currentUserId);
      }
    });

    newSocket.on("disconnect", () => {
      set({ isConnected: false });
    });

    // ---- Chat listeners ----
    newSocket.on("receive_message", (message) => {
      const { activeConversation, addMessage } = useChatStore.getState();
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

    newSocket.on("message_edited", (updatedMsg) => {
      useChatStore.getState().updateMessage(updatedMsg.id, {
        content: updatedMsg.content,
        isEdited: true,
      });
    });

    // ---- Calling listeners ----

    // Someone is calling you → store it so UI can show IncomingCall component
    newSocket.on("incoming_call", (data: IncomingCallData) => {
      set({ incomingCall: data });
    });

    // If the person we tried to call is offline
    newSocket.on("call_error", (error) => {
      console.error("❌ Call error:", error);
      alert(error?.message || "Call failed. User may be offline.");
    });

    newSocket.on("user_registered", (data) => {});

    set({ socket: newSocket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        currentUserId: null,
        incomingCall: null,
      });
    }
  },

  registerUser: (userId: number) => {
    const { socket, isConnected, currentUserId } = get();

    if (currentUserId === userId) {
      return;
    }

    set({ currentUserId: userId });

    if (socket && isConnected) {
      socket.emit("register_user", userId);
    } else if (socket && !isConnected) {
      const onConnect = () => {
        socket.emit("register_user", userId);
        socket.off("connect", onConnect);
      };
      socket.on("connect", onConnect);
    }
  },
}));
