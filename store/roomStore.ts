import { create } from "zustand";

type Room = {
  id: string;
  title: string;
  fk_user_id: string;
  room_state: boolean;
  thread_id: string;
  state: number;
  is_next: boolean;
};

type RoomStore = {
  selectedRoom: Room | null;
  setSelectedRoom: (room: Room) => void;
};

export const useRoomStore = create<RoomStore>((set) => ({
  selectedRoom: null,
  setSelectedRoom: (room) => set({ selectedRoom: room }),
}));
