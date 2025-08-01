"use client";

import { useRightPanelStore } from "@/store/rightPanelStore";
import { useRoomStore } from "@/store/roomStore";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

export default function ChatHeader() {
  const { showRight, open, close } = useRightPanelStore();
  const { selectedRoom, setSelectedRoom } = useRoomStore();
  const supabase = createClient();

  async function handleEndSession() {
    if (!selectedRoom) return;
    // if (!window.confirm("Are you sure you want to end the session?")) return;
    const isChallenge = selectedRoom.isChallenge;
    const newState = isChallenge ? 4 : 5;
    const { data, error } = await supabase
      .from("rooms")
      .update({ room_state: false, state: newState })
      .eq("id", selectedRoom.id)
      .select()
      .single();
    if (error) {
      alert("종료 처리에 실패했습니다.");
      return;
    }
    setSelectedRoom(data);
    window.dispatchEvent(new Event("refreshRooms"));
    alert("The session has been ended.");
  }
  return (
    <div className="h-12 bg-white px-4 flex items-center justify-between border-b-1 border-b-gray-100">
      <div className="flex items-center gap-2">
        <h1
          className="text-12 font-semibold text-gray-800 truncate overflow-hidden whitespace-nowrap"
          title={selectedRoom?.title}
        >
          {selectedRoom?.title}
        </h1>
        {(selectedRoom?.state === 3 ||
          selectedRoom?.state === 4 ||
          selectedRoom?.state === 5) && (
          <button
            className="ml-2 px-2 py-1 rounded-full bg-[#816eff] text-white text-xs hover:bg-[#6B50FF] cursor-pointer"
            onClick={async () => {
              // 챌린지 모드 활성화
              if (selectedRoom && !selectedRoom.isChallenge) {
                const { data, error } = await supabase
                  .from("rooms")
                  .update({ isChallenge: true })
                  .eq("id", selectedRoom.id)
                  .select()
                  .single();

                if (!error && data) {
                  setSelectedRoom(data);
                }
              }
              // 챌린지 모달 열기 (전역 상태나 이벤트로 처리)
              window.dispatchEvent(new CustomEvent("openChallengeModal"));
            }}
          >
            🔥 Challenge
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {selectedRoom?.state === 3 && (
          <button
            className="ml-2 px-3 py-1 rounded-full bg-red-500 text-white text-xs hover:bg-red-600 cursor-pointer"
            onClick={() => {
              if (window.confirm("Are you sure you want to end the session?")) {
                // alert("The session has been ended.");
                handleEndSession();
              }
            }}
          >
            End
          </button>
        )}
        {showRight ? (
          <div className="flex items-center gap-2">
            <div onClick={close} className="cursor-pointer">
              <Image
                src={"/ic-fullscreen-1.png"}
                width={20}
                height={20}
                alt="fullscreen"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div onClick={open} className="cursor-pointer">
              <Image
                src={"/ic-sidebar.png"}
                width={22}
                height={22}
                alt="sidebar"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
