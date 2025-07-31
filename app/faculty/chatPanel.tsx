"use client";

import { useRef, useState, useEffect } from "react";
import ChatHeader from "./chatHeader";
import { createClient } from "@/utils/supabase/client";
import { useRoomStore } from "@/store/roomStore";
import { useReplyStore } from "@/store/replyStore";
import Image from "next/image";
import formatChatTimestamp from "@/utils/formatChatTimestamp";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

function Chat() {
  return (
    <div className="flex-1 w-full flex flex-col justify-end">
      <div className="flex-1" />
      <div className="text-center text-gray-400">채팅 메시지 영역 (더미)</div>
    </div>
  );
}

function ChatInput({ facultyId }: { facultyId: string }) {
  const { selectedRoom } = useRoomStore();
  const { referencedMessage, clearReferencedMessage } = useReplyStore();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const studentId = selectedRoom?.fk_user_id;
  const roomId = selectedRoom?.id;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 3 * 20; // 3줄
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || !roomId || !studentId || !facultyId || sending)
      return;
    setSending(true);
    const supabase = createClient();
    await supabase.from("faculty_student_chats").insert({
      fk_room_id: roomId,
      fk_student_id: studentId,
      fk_faculty_id: facultyId,
      sender_role: "faculty",
      message,
      created_at: new Date(),
      referenced_message_id: referencedMessage?.id || null,
    });
    setMessage("");
    clearReferencedMessage();
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 bg-[#F8FAFA]/0 mb-3 w-full">
      {/* 참조 메시지 표시 영역 */}
      {referencedMessage && (
        <div className="mb-2 p-3 bg-gray-100 rounded-lg border-l-4 border-blue-500">
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs text-gray-600 font-medium">
              참조: {referencedMessage.role === "user" ? "Student" : "GPT"}
            </span>
            <button
              onClick={clearReferencedMessage}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-gray-700 line-clamp-2">
            {referencedMessage.message}
          </div>
          <button
            onClick={() => {
              if ((window as any).scrollToGptMessage) {
                (window as any).scrollToGptMessage(referencedMessage.id);
              }
            }}
            className="text-xs text-blue-500 hover:text-blue-700 mt-1"
          >
            원본 보기
          </button>
        </div>
      )}

      <div className="w-full border border-gray-300 rounded-xl px-3 py-2 flex flex-col bg-white">
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
  );
}

interface ChatPanelProps {
  userId: string; // 교수자 id
}

interface Chat {
  id: string;
  fk_room_id: string;
  fk_student_id: string;
  fk_faculty_id: string;
  sender_role: string;
  message: string;
  created_at: string;
  referenced_message_id?: string;
}

function FacultyChat({ facultyId }: { facultyId: string }) {
  const { selectedRoom } = useRoomStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [referencedMessages, setReferencedMessages] = useState<{
    [key: string]: any;
  }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  const studentId = selectedRoom?.fk_user_id;
  const roomId = selectedRoom?.id;

  // 메시지 삭제 함수
  const handleDeleteMessage = async (messageId: string) => {
    // 삭제 확인
    const isConfirmed = window.confirm("정말로 이 메시지를 삭제하시겠습니까?");
    if (!isConfirmed) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("faculty_student_chats")
        .delete()
        .eq("id", messageId);

      if (error) {
        console.error("메시지 삭제 실패:", error);
        return;
      }

      // 화면에서도 메시지 제거
      setChats((prevChats) =>
        prevChats.filter((chat) => chat.id !== messageId)
      );
    } catch (error) {
      console.error("메시지 삭제 중 오류:", error);
    }
  };

  useEffect(() => {
    async function fetchChats() {
      if (!roomId || !studentId || !facultyId) {
        setChats([]);
        return;
      }
      setLoading(true);
      const supabase = createClient();
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

  // 참조된 메시지 정보 가져오기
  useEffect(() => {
    async function fetchReferencedMessages() {
      if (!chats.length) return;

      const referencedIds = chats
        .filter((chat) => chat.referenced_message_id)
        .map((chat) => chat.referenced_message_id!)
        .filter((id, index, arr) => arr.indexOf(id) === index); // 중복 제거

      if (referencedIds.length === 0) return;

      const supabase = createClient();
      const { data } = await supabase
        .from("chats")
        .select("id, message, role")
        .in("id", referencedIds);

      if (data) {
        const messageMap: { [key: string]: any } = {};
        data.forEach((msg) => {
          messageMap[msg.id] = msg;
        });
        setReferencedMessages(messageMap);
      }
    }

    fetchReferencedMessages();
  }, [chats]);

  // 실시간 구독
  useEffect(() => {
    if (!roomId || !studentId || !facultyId) return;
    const supabase = createClient();
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [chats]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 w-full flex flex-col gap-3 p-4 overflow-y-auto"
    >
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
            아직 채팅이 없습니다.
          </div>
        </div>
      ) : (
        <>
          {chats.map((chat) => {
            if (chat.sender_role === "system") {
              return (
                <div key={chat.id} className="text-center text-gray-400 my-2">
                  {chat.message}
                </div>
              );
            }
            const isFaculty = chat.sender_role === "faculty";
            const referencedMessage = chat.referenced_message_id
              ? referencedMessages[chat.referenced_message_id]
              : null;
            const isHovered = hoveredMessageId === chat.id;

            return (
              <div
                key={chat.id}
                className={`flex items-end gap-1 ${
                  isFaculty ? "justify-end" : "justify-start"
                }`}
                onMouseEnter={() => setHoveredMessageId(chat.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                {isFaculty ? (
                  <>
                    <div className="flex items-end">
                      <div className="flex  items-center gap-2 mb-1 mr-2">
                        {isHovered && (
                          <button
                            onClick={() => handleDeleteMessage(chat.id)}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                          >
                            삭제
                          </button>
                        )}
                        <span className="text-[10px] text-gray-400 min-w-[32px] text-right">
                          {formatChatTimestamp(chat.created_at).time}
                        </span>
                      </div>
                      <div className="rounded-xl px-4 py-3  whitespace-pre-line text-sm bg-[#EDEEFC] text-gray-800">
                        {referencedMessage && (
                          <div
                            className="mb-2 p-2 bg-gray-50 rounded-lg border-l-2 border-blue-400 text-xs text-gray-700 max-w-[320px] cursor-pointer"
                            onClick={() => {
                              const ref = (window as any).gptMessageRefs?.[
                                referencedMessage.id
                              ];
                              console.log(
                                "ref",
                                ref,
                                referencedMessage.id,
                                window.gptMessageRefs
                              );
                              if (ref && ref.current) {
                                ref.current.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                              }
                            }}
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                            >
                              {referencedMessage.message}
                            </ReactMarkdown>
                          </div>
                        )}
                        {chat.message}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl px-4 py-3 max-w-[70%] whitespace-pre-line text-sm bg-[#d3d5fc] text-gray-800">
                      {chat.message}
                    </div>
                    <span className="text-[10px] text-gray-400 ml-2 mb-1 min-w-[32px] text-left">
                      {formatChatTimestamp(chat.created_at).time}
                    </span>
                  </>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}

export default function ChatPanel({ userId }: ChatPanelProps) {
  return (
    <div className="flex flex-col flex-1 h-full w-full">
      <div className="w-full">
        <ChatHeader />
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <FacultyChat facultyId={userId} />
        <ChatInput facultyId={userId} />
      </div>
    </div>
  );
}
