'use client';

import { create } from 'zustand';
import type { ChatResponse } from '@smartshop/shared';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  response?: ChatResponse;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  conversationId: string | undefined;
  isLoading: boolean;

  addMessage: (message: ChatMessage) => void;
  setConversationId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  clearChat: () => void;
  removeLastMessage: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  conversationId: undefined,
  isLoading: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setConversationId: (id) => set({ conversationId: id }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearChat: () => set({ messages: [], conversationId: undefined }),

  removeLastMessage: () =>
    set((state) => ({ messages: state.messages.slice(0, -1) })),
}));
