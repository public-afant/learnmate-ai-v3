import { create } from "zustand";

type Chat = {
  id: string;
  role: "user" | "assistant";
  content: string;
  fk_room_id: string;
  created_at: string;
  json: object;
};

type ChatStore = {
  selectedChat: Chat[];
  setSelectedChat: (chatList: Chat[]) => void;
  addChat: (chat: Chat) => void; // ⬅️ 추가
};

export const useChatStore = create<ChatStore>((set) => ({
  selectedChat: [],
  setSelectedChat: (chatList) => set({ selectedChat: chatList }),
  addChat: (chat) =>
    set((state) => ({
      selectedChat: [...state.selectedChat, chat],
    })),
}));
