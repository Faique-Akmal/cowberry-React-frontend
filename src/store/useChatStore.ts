import { create } from "zustand";
import { Conversation, Message, User } from "../types/chatTypes";

interface ChatState {
  activeConversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;

  // New States for UI Actions
  replyingTo: Message | null;
  editingMessage: Message | null;

  // Actions
  setActiveConversation: (conversation: Conversation) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  setCurrentUser: (user: User) => void;

  // New Actions
  setReplyingTo: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversation: null,
  messages: [],
  currentUser: null,
  replyingTo: null,
  editingMessage: null,

  setActiveConversation: (conversation) =>
    set({ activeConversation: conversation }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => {
      // Duplicate check
      if (state.messages.some((m) => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    }),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),

  setCurrentUser: (user) => set({ currentUser: user }),

  setReplyingTo: (message) =>
    set({ replyingTo: message, editingMessage: null }), // Clear edit if replying
  setEditingMessage: (message) =>
    set({ editingMessage: message, replyingTo: null }), // Clear reply if editing
}));
