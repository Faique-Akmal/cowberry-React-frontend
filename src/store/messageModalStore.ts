// src/stores/messageModalStore.ts
import { create } from 'zustand'
import { ChatMessage } from '../types/chat'

interface ModalState {
  isOpen: boolean
  mode: 'edit' | 'reply'
  targetMessage: ChatMessage | null
  openModal: (mode: 'edit' | 'reply', msg: ChatMessage) => void
  closeModal: () => void
}

export const useMessageModalStore = create<ModalState>((set) => ({
  isOpen: false,
  mode: 'edit',
  targetMessage: null,
  openModal: (mode, msg) => set({ isOpen: true, mode, targetMessage: msg }),
  closeModal: () => set({ isOpen: false, targetMessage: null }),
}))
