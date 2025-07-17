"use client";

import { useRightPanelStore } from "@/store/rightPanelStore";
import { useRoomStore } from "@/store/roomStore";
import Image from "next/image";

export default function ChatHeader() {
  const { showRight, open, close } = useRightPanelStore();
  const { selectedRoom } = useRoomStore();
  return (
    <div className="h-12 bg-white px-4 flex items-center justify-between border-b-1 border-b-gray-100 mt-1">
      <h1 className="text-12 font-semibold text-gray-800">
        {selectedRoom?.title}
      </h1>
      {showRight ? (
        <div onClick={close} className="cursor-pointer">
          <Image
            src={"/ic-fullscreen-1.png"}
            width={20}
            height={20}
            alt="fullscreen"
          />
        </div>
      ) : (
        <div onClick={open} className="cursor-pointer">
          <Image src={"/ic-sidebar.png"} width={22} height={22} alt="sidebar" />
        </div>
      )}
    </div>
  );
}
