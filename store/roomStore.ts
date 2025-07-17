import { create } from "zustand";

export type Room = {
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

// type Room = {
//   id: string;
//   title: string;
//   updated_at: string;
//   // 추가 필드들...
// };

// type RoomStore = {
//   selectedRoom: Room | null;
//   setSelectedRoom: (room: Room | null) => void;
// };

export const useRoomStore = create<RoomStore>((set) => ({
  selectedRoom: null,
  setSelectedRoom: (room) => set({ selectedRoom: room }),
}));
