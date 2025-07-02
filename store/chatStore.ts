import { create } from "zustand";

type Chat = {
  id: string;
  title: string;
};

type ChatStore = {
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  selectedChat: null,
  setSelectedChat: (chat) => set({ selectedChat: chat }),
}));
