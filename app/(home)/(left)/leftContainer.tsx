"use client";

import RoomList from "@/components/room-list";
import CreateModal from "./createModal";
import { useEffect, useState } from "react";
import { useRoomStore } from "@/store/roomStore";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function LeftContainer({ token }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const { setSelectedRoom } = useRoomStore();

  async function getRoomList(state) {
    const { data } = await supabase
      .from("rooms")
      .select(`*,note(*)`)
      .eq("fk_user_id", JSON.parse(token?.value ?? "").id)
      .order("updated_at", { ascending: false });

    const fetchedRooms = data ?? [];
    setRooms(fetchedRooms);

    if (fetchedRooms.length > 0) {
      if (state) {
        setSelectedRoom(fetchedRooms[0]);
      }
    }
  }

  useEffect(() => {
    getRoomList(true);
  }, []);

  // useEffect(() => {
  //   getRoomList(true);
  // }, [selectedRoom]);

  return (
    <div className=" min-w-[250px] max-w-[250px] p-1">
      <div className="flex justify-between p-3">
        <div className="text-[14px] font-bold flex items-center">
          My Learning Spaces
        </div>
        <CreateModal
          userId={JSON.parse(token?.value ?? "").id}
          getRoomList={getRoomList}
        />
      </div>
      <RoomList token={token} rooms={rooms} getRoomList={getRoomList} />
    </div>
  );
}
