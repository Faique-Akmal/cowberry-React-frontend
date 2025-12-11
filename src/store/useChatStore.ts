import { create } from "zustand";
import { Conversation, Message, User } from "../types/chatTypes";

interface ChatState {
  activeConversation: Conversation | null;
  messages: Message[];
  currentUser: User | null; // Logged in user

  // Actions
  setActiveConversation: (conversation: Conversation) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  setCurrentUser: (user: User) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversation: null,
  messages: [],
  currentUser: null,

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
}));
