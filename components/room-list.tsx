"use client";
// import { createClient } from "@/utils/supabase/server";

// import { createClient } from "@/utils/supabase/client";
// import { useEffect, useState } from "react";
import { useRoomStore } from "@/store/roomStore";
import Image from "next/image";

// const supabase = createClient();

type Room = {
  id: string;
  // 필요 시 다른 필드도 추가
  fk_user_id: string;
  room_state: boolean;
  thread_id: string;
  state: number;
  is_next: boolean;
  title: string;
  updated_at: string;
};

type RoomListProps = {
  rooms: Room[];
  getRoomList: () => void; // 또는 Promise<void> 등
};

export default function RoomList({ rooms, getRoomList }: RoomListProps) {
  return (
    <div className="overflow-y-scroll h-full hide-scrollbar pb-20">
      {rooms?.map((item) => {
        return (
          <div key={item.id}>
            <RoomItem item={item} getRoomList={getRoomList} />
            <div className="w-full h-[1px] bg-gray-100" />
          </div>
        );
      })}
    </div>
  );
}

function changeTime(time: string) {
  const formatted = time.substring(0, 16).replace("T", " ");
  return formatted;
}

type RoomItem = {
  id: string;
  title: string;
  updated_at: string;
  fk_user_id: string;
  room_state: boolean;
  thread_id: string;
  state: number;
  is_next: boolean;
};

type RoomItemProps = {
  item: RoomItem;
  getRoomList: (refresh: boolean) => void;
};

export function RoomItem({ item, getRoomList }: RoomItemProps) {
  const { setSelectedRoom } = useRoomStore();
  return (
    <div
      className="p-3 cursor-pointer hover:bg-gray-50 flex items-center h-full"
      onClick={() => {
        setSelectedRoom(item);
        getRoomList(false);
      }}
    >
      <div className="mr-3">
        <Image
          src={`/ic-state-${item.state}.png`}
          width={40}
          height={40}
          alt="state"
        />
      </div>
      <div className="flex flex-col max-w-[160px]">
        <div className="font-semibold text-sm truncate">{item.title}</div>
        <div className="text-[12px] text-gray-400 font-semibold">
          {changeTime(item.updated_at)}
        </div>
      </div>
    </div>
  );
}
