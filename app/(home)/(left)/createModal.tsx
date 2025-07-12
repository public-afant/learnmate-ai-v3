"use client";

import { useRoomStore } from "@/store/roomStore";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

const supabase = createClient();

export default function CreateModal({ userId, getRoomList }) {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const { setSelectedRoom } = useRoomStore();

  const handleModal = () => {
    setShowModal(!showModal);
    setTitle("");
  };

  const handleCreate = async () => {
    const { data, error } = await supabase
      .from("rooms")
      .insert({ fk_user_id: userId, title: title })
      .select(`*,note(*)`)
      .single(); // 새로 만든 row를 바로 가져옴

    if (error) {
      console.error("방 생성 오류:", error);
      return;
    }

    if (data) {
      setSelectedRoom(data); // ✅ 생성된 방으로 진입
      getRoomList();
    }

    setTitle("");
    setShowModal(false);
  };

  return (
    <>
      <div
        onClick={handleModal}
        className="bg-[#6B50FF] px-3 py-1 rounded-xl text-white text-[12px] cursor-pointer"
      >
        Create
      </div>
      {showModal && (
        <div className="absolute top-0 left-0 bg-black/40 w-full h-full z-10 flex justify-center items-center">
          <div className="bg-white rounded-2xl w-[350px] p-6">
            <div className="font-bold text-xl mb-4">
              Create a New Learning Space
            </div>
            <span className="text-[15px] font-semibold">
              Name Your Learning Space
            </span>
            <input
              placeholder="e.g., AI Study Plan, Global History Project"
              className="border-b-[1.5px] border-gray-400 w-full p-1 text-[14px]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-2 justify-between mt-4 *:text-sm *:text-[#6B50FF] *:cursor-pointer">
              <div onClick={handleModal}>Cancel</div>
              <div onClick={handleCreate}>Create</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
