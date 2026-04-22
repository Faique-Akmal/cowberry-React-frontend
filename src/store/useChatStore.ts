import { create } from "zustand";
import { Conversation, Message, User } from "../types/chatTypes";

interface ChatState {
  activeConversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;
  replyingTo: Message | null;
  editingMessage: Message | null;
  setActiveConversation: (conversation: Conversation) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  deleteMessage: (messageId: number) => void;
  setCurrentUser: (user: User) => void;
  getMessageById: (id: number) => Message | undefined;
  setReplyingTo: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
  resetMessages: () => void;
  clearDuplicateMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeConversation: null,
  messages: [], // Initialize as empty array
  currentUser: null,
  replyingTo: null,
  editingMessage: null,

  setActiveConversation: (conversation) =>
    set({ activeConversation: conversation }),

  setMessages: (messages) => {
    // Handle both array and function updater
    if (typeof messages === "function") {
      set((state) => ({
        messages: messages(Array.isArray(state.messages) ? state.messages : []),
      }));
    } else {
      // Remove any duplicates when setting messages
      const uniqueMessages = Array.isArray(messages)
        ? messages.filter(
            (message, index, self) =>
              index === self.findIndex((m) => m.id === message.id),
          )
        : [];
      set({ messages: uniqueMessages });
    }
  },

  addMessage: (message) =>
    set((state) => {
      const currentMessages = Array.isArray(state.messages)
        ? state.messages
        : [];

      const exists = currentMessages.some((m) => m.id === message.id);
      if (exists) return { messages: currentMessages };

      return { messages: [...currentMessages, message] };
    }),

  updateMessage: (messageId, updates) =>
    set((state) => {
      // Safety check: ensure messages is an array
      const currentMessages = Array.isArray(state.messages)
        ? state.messages
        : [];

      return {
        messages: currentMessages.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg,
        ),
      };
    }),

  deleteMessage: (messageId) =>
    set((state) => {
      // Safety check: ensure messages is an array
      const currentMessages = Array.isArray(state.messages)
        ? state.messages
        : [];

      return {
        messages: currentMessages.map((msg) =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: null, fileUrl: null }
            : msg,
        ),
      };
    }),

  setCurrentUser: (user) => set({ currentUser: user }),

  setReplyingTo: (message) =>
    set({ replyingTo: message, editingMessage: null }),

  setEditingMessage: (message) =>
    set({ editingMessage: message, replyingTo: null }),

  getMessageById: (id) => {
    const state = get();
    // Safety check: ensure messages is an array
    const currentMessages = Array.isArray(state.messages) ? state.messages : [];
    return currentMessages.find((msg) => msg.id === id);
  },

  resetMessages: () => set({ messages: [] }),

  clearDuplicateMessages: () => {
    const state = get();
    const currentMessages = Array.isArray(state.messages) ? state.messages : [];

    // Remove duplicates based on message id
    const uniqueMessages = currentMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id),
    );

    if (uniqueMessages.length !== currentMessages.length) {
      set({ messages: uniqueMessages });
    }
  },
}));
