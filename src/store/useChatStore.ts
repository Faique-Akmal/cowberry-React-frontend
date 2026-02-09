import { create } from "zustand";
import { Conversation, Message, User } from "../types/chatTypes";

interface ChatState {
  // Data State
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;

  // UI Action State
  replyingTo: Message | null;
  editingMessage: Message | null;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  setCurrentUser: (user: User) => void;

  // Real-time Update Actions
  addMessage: (message: Message) => void;
  updateMessage: (messageId: number, updates: Partial<Message>) => void;
  getMessageById: (id: number) => Message | undefined;
  
  // Add/Update Conversation in Sidebar
  addOrUpdateConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: number) => void;

  setReplyingTo: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
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

  setCurrentUser: (user) => set({ currentUser: user }),

  addMessage: (message) =>
    set((state) => {
      // 1. Update Messages if active
      let newMessages = state.messages;
      if (state.activeConversation?.id === message.conversationId) {
        if (!state.messages.some((m) => m.id === message.id)) {
          newMessages = [message, ...state.messages]; // Prepend for reverse list or Append depending on UI
          // Assuming UI renders reversed list (bottom up), usually Append is better for array but UI maps differently
          // Let's stick to standard append logic if UI handles scroll
          if (!state.messages.some((m) => m.id === message.id)) {
            newMessages = [...state.messages, message];
          }
        }
      }
      return { messages: newMessages };
    }),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),

  addOrUpdateConversation: (conversation) =>
    set((state) => {
      // Check if exists
      const exists = state.conversations.find((c) => c.id === conversation.id);
      let newConversations;
      if (exists) {
        // Update and move to top
        newConversations = [
          conversation,
          ...state.conversations.filter((c) => c.id !== conversation.id),
        ];
      } else {
        // Add to top
        newConversations = [conversation, ...state.conversations];
      }
      return { conversations: newConversations };
    }),

  removeConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== conversationId),
      activeConversation:
        state.activeConversation?.id === conversationId
          ? null
          : state.activeConversation,
    })),

  setReplyingTo: (message) =>
    set({ replyingTo: message, editingMessage: null }),

  setEditingMessage: (message) =>
    set({ editingMessage: message, replyingTo: null }),

  getMessageById: (id) => {
    const { messages } = get();
    return messages.find((msg) => msg.id === id)
  },
}));
