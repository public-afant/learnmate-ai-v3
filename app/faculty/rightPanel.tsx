"use client";

import { useEffect, useState, useRef } from "react";
import { useRightPanelStore } from "@/store/rightPanelStore";
import { useRoomStore } from "@/store/roomStore";
import { useReplyStore } from "@/store/replyStore";
import type { Room } from "@/store/roomStore";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import formatChatTimestamp from "@/utils/formatChatTimestamp";
import PlanModal from "@/components/planModal";
import PlanTab from "@/app/(home)/(right)/planTab";

function StudentChatListTab({ selectedRoom }: { selectedRoom: any }) {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const supabase = createClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { setReferencedMessage } = useReplyStore();
  const [planModalData, setPlanModalData] = useState<{json: any, date: string} | null>(null);

  // 메시지로 스크롤하는 함수
  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement && containerRef.current) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // 전역 함수로 등록 (ChatInput에서 호출할 수 있도록)
  useEffect(() => {
    (window as any).scrollToGptMessage = scrollToMessage;
    return () => {
      delete (window as any).scrollToGptMessage;
    };
  }, []);

  useEffect(() => {
    async function fetchChats() {
      if (!selectedRoom?.id) {
        setChats([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("chats")
        .select("id, message, role, created_at, json")
        .eq("fk_room_id", selectedRoom.id)
        .order("created_at", { ascending: true }); // 오름차순(최신이 아래)
      setChats(data ?? []);
      setLoading(false);
    }
    fetchChats();
  }, [selectedRoom]);

  // 항상 스크롤을 맨 아래로
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chats]);

  if (loading) {
    return <div className="p-6 text-gray-400 text-sm">Loading...</div>;
  }
  if (!selectedRoom?.id) {
    return (
      <div className="p-6 text-gray-400 text-sm">채팅방을 선택하세요.</div>
    );
  }
  if (!chats.length) {
    return (
      <div className="flex flex-col items-center mt-10">
        <div>
          <Image src="/ic-plan.png" width={200} height={100} alt="no-chats" />
        </div>
        <div className="font-bold text-[16px] mt-4">No chats available.</div>
      </div>
    );
  }
  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 h-full flex flex-col gap-3 p-4 overflow-y-auto"
      >
        {chats.map((chat) => {
          const time = chat.created_at?.slice(11, 16) || "";
          const isUser = chat.role === "user";
          const isHovered = hoveredMessageId === chat.id;

          const handleReply = () => {
            setReferencedMessage({
              id: chat.id,
              message: chat.message,
              role: chat.role,
              created_at: chat.created_at,
            });
          };

          return (
            <div
              key={chat.id}
              ref={(el) => {
                messageRefs.current[chat.id] = el;
              }}
              className={`flex items-end gap-1 ${
                isUser ? "justify-end" : "justify-start"
              }`}
              onMouseEnter={() => setHoveredMessageId(chat.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {isUser ? (
                <>
                  <div className="flex flex-col items-end">
                    <div className="rounded-xl px-4 py-3 ml-15 whitespace-pre-line text-sm bg-[#EDEEFC] text-gray-800">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {chat.message}
                      </ReactMarkdown>
                      {chat.json && (
                        <div
                          onClick={() => setPlanModalData({ json: chat.json, date: chat.created_at })}
                          className="cursor-pointer mt-2 px-2 py-1 rounded-sm bg-[#816eff] hover:bg-[#6B50FF] text-white text-sm inline-block"
                        >
                          Show Plan
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      {isHovered && (
                        <button
                          onClick={handleReply}
                          className="text-xs text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          Reply
                        </button>
                      )}
                      <span className="text-[10px] text-gray-400 min-w-[32px] text-right">
                        {formatChatTimestamp(chat.created_at).time}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-start">
                  <div className="rounded-xl px-4 py-3 max-w-[70%] whitespace-pre-line text-sm bg-[#d3d5fc] text-gray-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {chat.message}
                    </ReactMarkdown>
                    {chat.json && (
                      <div
                        onClick={() => setPlanModalData({ json: chat.json, date: chat.created_at })}
                        className="cursor-pointer mt-2 px-2 py-1 rounded-sm bg-[#816eff] hover:bg-[#6B50FF] text-white text-sm inline-block"
                      >
                        Show Plan
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start ml-1 mt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-gray-400 min-w-[32px] text-left">
                        {formatChatTimestamp(chat.created_at).time}
                      </span>
                      {isHovered && (
                        <button
                          onClick={handleReply}
                          className="text-xs text-gray-500 hover:text-blue-500 transition-colors"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {planModalData && (
        <PlanModal
          json={planModalData.json}
          setIsModal={() => setPlanModalData(null)}
          hideConfirm={true}
          date={planModalData.date}
        />
      )}
    </>
  );
}



export default function RightPanel() {
  const { showRight } = useRightPanelStore();
  const [rightWidth, setRightWidth] = useState(400);
  const [resizing, setResizing] = useState<"right" | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "plan">("chat");
  const { selectedRoom } = useRoomStore();

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
    { key: "chat", label: "Learning Chats" },
    { key: "plan", label: "Learning Plan" },
  ];

  return (
    <>
      {showRight && (
        <div
          onMouseDown={handleMouseDown}
          className="w-[3px] cursor-col-resize bg-gray-100"
        />
      )}
      {showRight && (
        <div
          className="relative flex flex-col bg-white h-full z-1 overflow-hidden"
          style={{ width: rightWidth, willChange: "width", transform: "none" }}
        >
          {/* 탭 헤더 */}
          <div className="flex justify-around px-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "chat" | "plan")}
                className={`relative z-0 isolation-auto px-3 py-3 font-medium text-sm ${
                  activeTab === tab.key
                    ? "text-black font-semibold"
                    : "text-gray-400"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 h-full min-h-0 flex flex-col p-0">
            {activeTab === "chat" && (
              <StudentChatListTab selectedRoom={selectedRoom} />
            )}
            {activeTab === "plan" && (
              <PlanTab selectedRoom={selectedRoom} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
