import { create } from "zustand";

type Room = {
  id: string;
  title: string;
};

type RoomStore = {
  selectedRoom: Room | null;
  setSelectedRoom: (room: Room) => void;
};

export const useRoomStore = create<RoomStore>((set) => ({
  selectedRoom: null,
  setSelectedRoom: (room) => set({ selectedRoom: room }),
}));
