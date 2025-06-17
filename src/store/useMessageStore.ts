import { create } from 'zustand';
import { nanoid } from 'nanoid';

export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface MessageState {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  updateLastAIMessage: (content: string) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  isLoading: false,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  updateLastAIMessage: (content: string) => set((state) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage && lastMessage.role === 'ai') {
      return { messages: [...state.messages.slice(0, -1), { ...lastMessage, content }] };
    }
    return { messages: [...state.messages, { id: nanoid(), role: 'ai', content }] };
  }),
})); 