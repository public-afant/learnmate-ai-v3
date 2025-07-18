import { create } from "zustand";

type ReplyMessage = {
  id: string;
  message: string;
  role: string;
  created_at: string;
};

type ReplyStore = {
  referencedMessage: ReplyMessage | null;
  setReferencedMessage: (message: ReplyMessage | null) => void;
  clearReferencedMessage: () => void;
};

export const useReplyStore = create<ReplyStore>((set) => ({
  referencedMessage: null,
  setReferencedMessage: (message) => set({ referencedMessage: message }),
  clearReferencedMessage: () => set({ referencedMessage: null }),
}));
