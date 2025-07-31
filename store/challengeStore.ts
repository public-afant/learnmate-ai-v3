import { create } from "zustand";

type ChallengeChat = {
  id: string;
  role: "user" | "assistant";
  message: string;
  fk_room_id: string;
  fk_user_id: string;
  created_at: string;
  json?: object;
};

type ChallengeStore = {
  challengeChats: ChallengeChat[];
  setChallengeChats: (chats: ChallengeChat[]) => void;
  addChallengeChat: (chat: ChallengeChat) => void;
  clearChallengeChats: () => void;
};

export const useChallengeStore = create<ChallengeStore>((set) => ({
  challengeChats: [],
  setChallengeChats: (chats) => set({ challengeChats: chats }),
  addChallengeChat: (chat) =>
    set((state) => ({
      challengeChats: [...state.challengeChats, chat],
    })),
  clearChallengeChats: () => set({ challengeChats: [] }),
}));
