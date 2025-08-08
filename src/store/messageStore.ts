// src/stores/messageStore.ts

import { create } from 'zustand'
import { ChatMessage } from '../types/chat'

interface MessageState {
  messages: ChatMessage[]

  loadMessages: (newMessages: ChatMessage[]) => void
  addMessage: (msg: ChatMessage) => void
  editMessage: (id: number, updatedFields: Partial<ChatMessage>) => void
  deleteMessage: (id: number) => void
  addReply: (parentId: number, reply: ChatMessage) => void
  clearMessages: () => void

  getMessageById: (id: number) => ChatMessage | undefined
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],

  loadMessages: (newMessages) => set({ messages: newMessages }),

  addMessage: (msg) => set((state) => {
    if (!msg || typeof msg !== 'object' || !msg.id) {
      console.warn("⚠️ Invalid message ignored:", msg);
      return state;
    }

    // prevent accidental duplicates
    if (state.messages.some((m) => m.id === msg.id)) {
      return state;
    }

    return {
      messages: [...state.messages, msg],
    };
  }),

  editMessage: (id, updatedFields) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updatedFields } : msg
      ),
    })),

  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: "", is_deleted: true } : msg
      ),
    })),

  addReply: (parentId, reply) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg?.id === parentId
          ? { ...msg, replies: [...msg.replies!, reply] }
          : msg
      ),
    })),

  clearMessages: () => set({ messages: [] }),

  getMessageById: (id) => {
    const { messages } = get();
    return messages.find((msg) => msg.id === id)
  },
}))
