"use client";
// import { createClient } from "@/utils/supabase/server";

// import { createClient } from "@/utils/supabase/client";
// import { useEffect, useState } from "react";
import { useRoomStore } from "@/store/roomStore";
// import Image from "next/image";

// const supabase = createClient();

export default function RoomList({ rooms, getRoomList }) {
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

function changeTime(time: { time: any }) {
  const formatted = time.substring(0, 16).replace("T", " ");
  return formatted;
}

export function RoomItem({ item, getRoomList }: { item: any }) {
  const { setSelectedRoom } = useRoomStore();
  //   console.log(item);
  return (
    <div
      className="p-3 cursor-pointer hover:bg-gray-50 flex items-center h-full"
      onClick={() => {
        setSelectedRoom(item);
        getRoomList(false);
      }}
    >
      <div className="mr-2">
        {/* <Image
          src={`/ic-status-${item.state}.png`}
          width={35}
          height={35}
          alt="state"
        /> */}
      </div>
      <div>
        <div className="font-semibold text-sm">{item.title}</div>
        <div className="text-[12px] text-gray-400 font-semibold">
          {changeTime(item.updated_at)}
        </div>
      </div>
    </div>
  );
}
