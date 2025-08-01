"use client";

import { useEffect, useState, useRef, KeyboardEvent } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import formatChatTimestamp from "@/utils/formatChatTimestamp";

interface InstructorChatTabProps {
  selectedRoom?: {
    id: string;
    fk_user_id: string;
    state?: number;
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
  referenced_message_id?: string;
}

const supabase = createClient();

export default function InstructorChatTab({
  selectedRoom,
}: InstructorChatTabProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [referencedMessages, setReferencedMessages] = useState<{
    [key: string]: any;
  }>({});

  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement && containerRef.current) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    (window as any).scrollToGptMessage = scrollToMessage;
    return () => {
      delete (window as any).scrollToGptMessage;
    };
  }, []);

  const studentId = selectedRoom?.fk_user_id;
  const roomId = selectedRoom?.id;
  const [facultyId, setFacultyId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFacultyId() {
      if (!roomId) return;
      // console.log("Fetching faculty ID for room:", roomId);
      const { data, error } = await supabase
        .from("invite")
        .select("fk_user_faculty_id")
        .eq("fk_room_id", roomId)
        .single();

      if (error) {
        console.error("Error fetching faculty ID:", error);
      } else {
        // console.log("Faculty ID fetched:", data?.fk_user_faculty_id);
      }

      setFacultyId(data?.fk_user_faculty_id || null);
    }
    fetchFacultyId();
  }, [roomId]);

  useEffect(() => {
    async function fetchChats() {
      if (!roomId || !studentId || !facultyId) {
        // console.log("Missing required data:", { roomId, studentId, facultyId });
        setChats([]);
        return;
      }
      // console.log("Fetching chats for:", { roomId, studentId, facultyId });
      setLoading(true);
      const { data, error } = await supabase
        .from("faculty_student_chats")
        .select("*")
        .eq("fk_room_id", roomId)
        .eq("fk_student_id", studentId)
        .eq("fk_faculty_id", facultyId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching chats:", error);
      } else {
        // console.log("Chats fetched:", data?.length || 0);
      }

      setChats(data ?? []);
      setLoading(false);
    }
    fetchChats();
  }, [roomId, studentId, facultyId]);

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
            // 중복 방지: 이미 존재하는 메시지는 추가하지 않음
            setChats((prev) => {
              const exists = prev.some((chat) => chat.id === payload.new.id);
              if (exists) {
                // console.log(
                //   "Message already exists, skipping:",
                //   payload.new.id
                // );
                return prev;
              }
              // console.log(
              //   "Adding new message via subscription:",
              //   payload.new.id
              // );
              return [...prev, payload.new as Chat];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "faculty_student_chats",
        },
        (payload) => {
          setChats((prev) => prev.filter((chat) => chat.id !== payload.old.id));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, studentId, facultyId]);

  useEffect(() => {
    const scrollToBottom = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        container.scrollTop = container.scrollHeight;
      }
    };

    // DOM 업데이트 후 스크롤 실행 (여러 번 시도)
    setTimeout(scrollToBottom, 0);
    setTimeout(scrollToBottom, 100);
    setTimeout(scrollToBottom, 200);
  }, [chats]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 3 * 20;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !roomId || !studentId || !facultyId || sending) {
      // console.log("Cannot send message:", {
      //   hasInput: !!input.trim(),
      //   roomId,
      //   studentId,
      //   facultyId,
      //   sending,
      // });
      return;
    }

    const message = input.trim();
    // console.log("Sending message:", { roomId, studentId, facultyId, message });
    setInput("");
    setSending(true);

    const { data, error } = await supabase
      .from("faculty_student_chats")
      .insert({
        fk_room_id: roomId,
        fk_student_id: studentId,
        fk_faculty_id: facultyId,
        sender_role: "student",
        message: message,
      })
      .select()
      .single();

    if (error) {
      console.error("메시지 전송 실패:", error);
    } else if (data) {
      // console.log("Message sent successfully:", data);
      // 실시간 구독에서 자동으로 추가되므로 로컬 상태 업데이트 제거
      // setChats((prev) => [...prev, data]);
    }
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    async function fetchReferencedMessages() {
      if (!chats.length) return;
      const refIds = chats
        .filter(
          (chat) => chat.sender_role === "faculty" && chat.referenced_message_id
        )
        .map((chat) => chat.referenced_message_id)
        .filter((id, idx, arr) => id && arr.indexOf(id) === idx);
      if (refIds.length === 0) return;
      const { data } = await supabase
        .from("chats")
        .select("id, message, role")
        .in("id", refIds);
      if (data) {
        const map: { [key: string]: any } = {};
        data.forEach((msg) => {
          map[msg.id] = msg;
        });
        setReferencedMessages(map);
      }
    }
    fetchReferencedMessages();
  }, [chats]);

  const [isInstructorAccepted, setIsInstructorAccepted] =
    useState<boolean>(false);
  useEffect(() => {
    async function checkInstructorAccepted() {
      if (!roomId) return;
      const { data } = await supabase
        .from("invite")
        .select("state")
        .eq("fk_room_id", roomId)
        .single();
      setIsInstructorAccepted(!!data?.state);
    }
    checkInstructorAccepted();
  }, [roomId]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex flex-col flex-1 min-h-0 p-4 gap-3"
        style={{ height: "calc(100vh - 200px)" }}
      >
        {selectedRoom?.state === 2 && !isInstructorAccepted ? (
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-semibold">
            Waiting for the instructor to accept your request
          </div>
        ) : isInstructorAccepted ? (
          <>
            <div
              ref={containerRef}
              className="flex-1 min-h-0 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 280px)" }}
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
                  <div className="font-bold text-[16px] mt-4 text-gray-500">
                    No instructor chats yet.
                  </div>
                </div>
              ) : (
                chats.map((chat: Chat, index: number) => {
                  if (chat.sender_role === "system") {
                    return (
                      <div
                        key={`${chat.id}-${index}`}
                        className="text-center text-gray-400 my-2"
                      >
                        {chat.message}
                      </div>
                    );
                  }
                  const isStudent = chat.sender_role === "student";
                  const referenced =
                    chat.sender_role === "faculty" && chat.referenced_message_id
                      ? referencedMessages[chat.referenced_message_id]
                      : null;
                  return (
                    <div
                      key={`${chat.id}-${index}`}
                      ref={(el) => {
                        messageRefs.current[chat.id] = el;
                      }}
                      className={`flex items-end gap-1 my-2 ${
                        isStudent ? "justify-end" : "justify-start"
                      }`}
                    >
                      {isStudent ? (
                        <div className="flex items-end ml-10">
                          <div className="flex items-center gap-2 my-1 mr-3">
                            <span className="text-[10px] text-gray-400 min-w-[32px] text-right">
                              {formatChatTimestamp(chat.created_at).time}
                            </span>
                          </div>
                          <div className="rounded-xl px-4 py-3 whitespace-pre-line text-sm bg-[#EDEEFC] text-gray-800">
                            {chat.message}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-end">
                          <div className="rounded-xl px-4 py-3 whitespace-pre-line text-sm bg-[#d3d5fc] text-gray-800">
                            {referenced && (
                              <div
                                className="mb-2 p-2 bg-gray-50 rounded-lg border-l-2 border-blue-400 cursor-pointer"
                                onClick={() => {
                                  const ref = (window as any).gptMessageRefs?.[
                                    referenced.id
                                  ];
                                  if (ref && ref.current) {
                                    ref.current.scrollIntoView({
                                      behavior: "smooth",
                                      block: "center",
                                    });
                                  }
                                }}
                              >
                                <div className="text-xs text-gray-500 mb-1">
                                  참조:{" "}
                                  {referenced.role === "user"
                                    ? "학생"
                                    : referenced.role === "assistant"
                                    ? "GPT"
                                    : referenced.role}
                                </div>
                                <div className="text-xs text-gray-700 line-clamp-2">
                                  {referenced.message}
                                </div>
                              </div>
                            )}
                            {chat.message}
                          </div>
                          <div className="flex flex-col items-start ml-3">
                            <div className="flex items-center gap-2 my-1">
                              <span className="text-[10px] text-gray-400 min-w-[32px] text-left">
                                {formatChatTimestamp(chat.created_at).time}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {selectedRoom?.state !== 4 && (
              <div className="flex-shrink-0 mt-auto">
                <div className="px-2 py-1 bg-white border-t border-gray-100">
                  <div className="w-full border border-gray-300 rounded-xl px-3 py-2 flex flex-col bg-white">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
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
            )}
            {selectedRoom?.state === 4 && (
              <div className="text-center text-gray-500 text-sm mt-2 p-2 bg-gray-50 rounded-lg">
                This learning session has been ended.
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400 text-lg font-semibold">
            Reach the Sprout Stage to start matching.
          </div>
        )}
      </div>
    </div>
  );
}
