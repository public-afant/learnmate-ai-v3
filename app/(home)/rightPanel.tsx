"use client";

import { useEffect, useState } from "react";
import { useRightPanelStore } from "@/store/rightPanelStore";
import PlanTab from "./(right)/planTab";
import NoteTab from "./(right)/noteTab";
import { useRoomStore } from "@/store/roomStore";
import InstructorChatTab from "./(right)/instructorChatTab";

export default function RightPanel() {
  const { showRight } = useRightPanelStore();
  const [rightWidth, setRightWidth] = useState(750);
  const [resizing, setResizing] = useState<"right" | null>(null);
  const [activeTab, setActiveTab] = useState<string>("plan");
  const { selectedRoom } = useRoomStore();

  const handleMouseDown = () => setResizing("right");
  const handleMouseUp = () => setResizing(null);

  useEffect(() => {
    if (!showRight) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing === "right") {
        setRightWidth(Math.max(280, window.innerWidth - e.clientX));
      }
    };
    const handleMouseUp = () => setResizing(null);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing, showRight]);

  const TABS = [
    { key: "plan", label: "Learning Plan" },
    { key: "note", label: "Learning Notes" },
    { key: "chat", label: "Instructor Chat", badge: "" },
  ];

  return (
    <>
      {showRight && (
        <div className="relative h-full">
          <div
            onMouseDown={handleMouseDown}
            className="absolute left-0 top-0 h-full w-8 cursor-col-resize z-10"
            style={{ background: "transparent" }}
          />
          <div className="w-[3px] h-full bg-gray-100" />
        </div>
      )}
      {showRight && (
        <div
          className="relative pt-1 flex flex-col bg-white h-full mt-1 z-1"
          style={{ width: rightWidth }}
        >
          {/* <RightHeader /> */}

          {/* 탭 헤더 */}
          <div className="flex justify-around px-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative z-0 isolation-auto px-3 py-3 font-medium text-sm ${
                  activeTab === tab.key
                    ? "text-black font-semibold"
                    : "text-gray-400"
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="ml-1 bg-indigo-100 text-indigo-500 text-[10px] px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 overflow-auto p-4 text-sm">
            {activeTab === "plan" && <PlanTab selectedRoom={selectedRoom} />}
            {activeTab === "note" && <NoteTab selectedRoom={selectedRoom} />}
            {activeTab === "chat" && (
              <InstructorChatTab selectedRoom={selectedRoom ?? undefined} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
