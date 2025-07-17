"use client";

import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

interface InstructorChatTabProps {
  selectedRoom?: {
    id: string;
    fk_user_id: string;
    // 필요한 필드 추가
  };
}

interface Chat {
  id: string;
  fk_room_id: string;
  fk_student_id: string;
  fk_faculty_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

const supabase = createClient();

export default function InstructorChatTab({
  selectedRoom,
}: InstructorChatTabProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // TODO: 실제 로그인 학생 id, 교수 id를 받아와야 함
  const studentId = selectedRoom?.fk_user_id;
  const roomId = selectedRoom?.id;
  // 교수 id는 selectedRoom에 없으면 invite 등에서 fetch 필요
  const [facultyId, setFacultyId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFacultyId() {
      if (!roomId) return;
      // invite 테이블에서 교수 id 조회
      const { data } = await supabase
        .from("invite")
        .select("fk_user_faculty_id")
        .eq("fk_room_id", roomId)
        .eq("state", true)
        .single();
      setFacultyId(data?.fk_user_faculty_id || null);
    }
    fetchFacultyId();
  }, [roomId]);

  useEffect(() => {
    async function fetchChats() {
      if (!roomId || !studentId || !facultyId) {
        setChats([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("faculty_student_chats")
        .select("*")
        .eq("fk_room_id", roomId)
        .eq("fk_student_id", studentId)
        .eq("fk_faculty_id", facultyId)
        .order("created_at", { ascending: true });
      setChats(data ?? []);
      setLoading(false);
    }
    fetchChats();
  }, [roomId, studentId, facultyId]);

  // 실시간 구독
  useEffect(() => {
    if (!roomId || !studentId || !facultyId) return;
    const channel = supabase
      .channel("faculty-student-chat-" + roomId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "faculty_student_chats",
        },
        (payload) => {
          if (
            payload.new.fk_room_id === roomId &&
            payload.new.fk_student_id === studentId &&
            payload.new.fk_faculty_id === facultyId
          ) {
            setChats((prev) => [...prev, payload.new as Chat]);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, studentId, facultyId]);

  // 스크롤 항상 하단
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as HTMLDivElement).scrollTop = (
        containerRef.current as HTMLDivElement
      ).scrollHeight;
    }
  }, [chats]);

  // 입력창 자동 높이 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 3 * 20; // 3줄
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
    }
  }, [input]);

  // 메시지 전송
  const handleSend = async () => {
    if (!input.trim() || !roomId || !studentId || !facultyId || sending) return;
    setSending(true);
    await supabase.from("faculty_student_chats").insert({
      fk_room_id: roomId,
      fk_student_id: studentId,
      fk_faculty_id: facultyId,
      sender_role: "student",
      message: input,
      created_at: new Date(),
    });
    setInput("");
    setSending(false);
  };

  // 엔터(shift+enter 제외)로 전송
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-1 min-h-0 p-4 gap-3">
        <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="text-gray-400 text-center">Loading...</div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center mt-10">
              <Image
                src="/ic-approval.png"
                width={200}
                height={100}
                alt="no-chats"
              />
              <div className="font-bold text-[16px] mt-4">
                No instructor chats yet.
              </div>
            </div>
          ) : (
            chats.map((chat: Chat) => {
              if (chat.sender_role === "system") {
                return (
                  <div key={chat.id} className="text-center text-gray-400 my-2">
                    {chat.message}
                  </div>
                );
              }
              const isStudent = chat.sender_role === "student";
              return (
                <div
                  key={chat.id}
                  className={`flex items-end gap-1 ${
                    isStudent ? "justify-end" : "justify-start"
                  }`}
                >
                  {isStudent ? (
                    <>
                      <span className="text-[10px] text-gray-400 mr-2 mb-1 min-w-[32px] text-right">
                        {chat.created_at?.slice(11, 16) || ""}
                      </span>
                      <div className="rounded-xl px-4 py-3 max-w-[70%] whitespace-pre-line text-sm bg-[#EDEEFC] text-gray-800">
                        {chat.message}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl px-4 py-3 max-w-[70%] whitespace-pre-line text-sm bg-[#d3d5fc] text-gray-800">
                        {chat.message}
                      </div>
                      <span className="text-[10px] text-gray-400 ml-2 mb-1 min-w-[32px] text-left">
                        {chat.created_at?.slice(11, 16) || ""}
                      </span>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="px-2 py-2 bg-white border-t border-gray-100">
            <div className="w-full border border-gray-300 rounded-xl px-3 py-2 flex flex-col bg-white">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                className="w-full resize-none overflow-y-auto text-sm focus:outline-none max-h-[60px] mb-3 bg-white"
                style={{ lineHeight: "20px" }}
                disabled={sending}
              />
              <div className="flex justify-end">
                <div
                  className={`text-sm px-3 py-1 rounded-xl bg-[#816eff] hover:bg-[#6B50FF] text-white cursor-pointer ${
                    sending ? "opacity-50 pointer-events-none" : ""
                  }`}
                  onClick={handleSend}
                >
                  Send
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
