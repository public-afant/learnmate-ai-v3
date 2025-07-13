"use client";

import { useChatStore } from "@/store/chatStore";
import { useRoomStore } from "@/store/roomStore";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

const supabase = createClient();

type SelectFacultyProps = {
  setNextModal: (value: boolean) => void;
  handleGPT: (chat: string, dummy: string, type: number) => void;
};

export default function SelectFaculty({
  setNextModal,
  handleGPT,
}: SelectFacultyProps) {
  const [list, setList] = useState(null);
  const { selectedRoom, setSelectedRoom } = useRoomStore();
  const { selectedChat } = useChatStore();

  async function getFaculty() {
    const { data } = await supabase.from("faculty").select().eq("state", true);
    setList(data);
  }

  useEffect(() => {
    getFaculty();
  }, []);

  const handleEvent = async (item) => {
    await supabase
      .from("invite")
      .insert({
        fk_user_id: selectedRoom?.fk_user_id,
        fk_room_id: selectedRoom?.id,
        fk_faculty_id: item.id,
      })
      .select()
      .single();

    const { data: result } = await supabase
      .from("rooms")
      .update({ state: 2, is_next: false, thread_id: "" })
      .eq("id", selectedRoom?.id)
      .select(`*,note(*)`)
      .single();

    setSelectedRoom(result);

    handleGPT(JSON.stringify(selectedChat), "", 2);
    setNextModal(false);
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black/40 z-[1000] flex justify-center items-center">
      <div className="w-[300px] h-[300px] bg-white rounded-2xl p-7">
        <div className="font-bold text-[18px]">Choose your instructor</div>
        <div className=" my-2 h-[180px] overflow-y-auto">
          {list !== null &&
            list.map((item) => {
              return (
                <div
                  className="cursor-pointer hover:bg-gray-100 p-1"
                  key={item.id}
                  onClick={() => handleEvent(item)}
                >
                  {item.name}
                </div>
              );
            })}
        </div>
        <div className="flex justify-end">
          <div
            onClick={() => setNextModal(false)}
            className="text=sm text-[#816eff] cursor-pointer"
          >
            cancel
          </div>
        </div>
      </div>
    </div>
  );
}
