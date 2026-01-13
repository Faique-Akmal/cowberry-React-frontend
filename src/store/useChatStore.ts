import { create } from "zustand";
import { Conversation, Message, User } from "../types/chatTypes";

interface ChatState {
  // Data
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;

  // UI Actions
  replyingTo: Message | null;
  editingMessage: Message | null;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;

  // Real-time Updates
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  addConversation: (conversation: Conversation) => void; // New Group created

  setCurrentUser: (user: User) => void;
  setReplyingTo: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  currentUser: null,
  replyingTo: null,
  editingMessage: null,

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (conversation) =>
    set({ activeConversation: conversation }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => {
      // 1. Add to message list if current chat
      let newMessages = state.messages;
      if (state.activeConversation?.id === message.conversationId) {
        if (!state.messages.some((m) => m.id === message.id)) {
          newMessages = [...state.messages, message];
        }
      }

      // 2. Update conversation list (Move to top & update last msg preview if we had one)
      // For now, re-fetching list is easier, but optimistic update works too.
      return { messages: newMessages };
    }),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [
        conversation,
        ...state.conversations.filter((c) => c.id !== conversation.id),
      ],
    })),

  setCurrentUser: (user) => set({ currentUser: user }),
  setReplyingTo: (message) =>
    set({ replyingTo: message, editingMessage: null }),
  setEditingMessage: (message) =>
    set({ editingMessage: message, replyingTo: null }),
}));
