"use client";

import { useState } from "react";
import { useRightPanelStore } from "@/store/rightPanelStore";
import PlanTab from "./(right)/planTab";
import NoteTab from "./(right)/noteTab";

export default function RightPanel() {
  const { showRight } = useRightPanelStore();
  const [rightWidth, setRightWidth] = useState(750);
  const [resizing, setResizing] = useState<"right" | null>(null);
  const [activeTab, setActiveTab] = useState<"plan" | "note" | "chat">("plan");

  const handleMouseDown = () => setResizing("right");
  const handleMouseUp = () => setResizing(null);
  const handleMouseMove = (e: MouseEvent) => {
    if (resizing === "right") {
      setRightWidth(Math.max(280, window.innerWidth - e.clientX));
    }
  };

  if (typeof window !== "undefined") {
    window.onmousemove = handleMouseMove;
    window.onmouseup = handleMouseUp;
  }

  const TABS = [
    { key: "plan", label: "학습 계획서" },
    { key: "note", label: "학습 노트" },
    { key: "chat", label: "교수자 대화", badge: "99+" },
  ];

  return (
    <>
      {showRight && (
        <div
          onMouseDown={handleMouseDown}
          className="w-[1px] cursor-col-resize bg-gray-100"
        />
      )}
      {showRight && (
        <div
          className="relative pt-1 flex flex-col bg-white h-full mt-1"
          style={{ width: rightWidth }}
        >
          {/* <RightHeader /> */}

          {/* 탭 헤더 */}
          <div className="flex justify-around px-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative px-3 py-3 font-medium text-sm ${
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
            {activeTab === "plan" && <PlanTab />}
            {activeTab === "note" && <NoteTab />}
            {activeTab === "chat" && <div>💬 교수자와의 대화</div>}
          </div>
        </div>
      )}
    </>
  );
}
