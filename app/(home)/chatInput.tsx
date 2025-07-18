"use client";

import SelectFaculty from "@/components/selectFaculty";
import { useChatStore } from "@/store/chatStore";
import { useRoomStore } from "@/store/roomStore";
import { useReplyStore } from "@/store/replyStore";
import { createClient } from "@/utils/supabase/client";
import axios from "axios";
import { useState, useRef, useEffect } from "react";

const supabase = createClient();

export default function ChatInput({ setIsLoading }) {
  // const [isNext, setIsNext] = useState(false);
  const [nextModal, setNextModal] = useState(false);
  const [message, setMessage] = useState("");
  // const [thread, setThread] = useState("");
  const [isComposing, setIsComposing] = useState(false); // ⬅️ 한글 입력 조합 상태
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedRoom, setSelectedRoom } = useRoomStore();
  const { addChat } = useChatStore();
  const { referencedMessage, clearReferencedMessage } = useReplyStore();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 3 * 20;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
    }
  }, [message]);

  useEffect(() => {
    // setThread(selectedRoom?.thread_id ?? "");
    // setIsNext(selectedRoom?.is_next ?? false);
  }, []);

  const handleSend = async () => {
    if (!selectedRoom?.room_state || !message.trim()) return;

    const content = message.trim();
    setMessage("");

    // 1. user message insert
    const { data, error } = await supabase
      .from("chats")
      .insert({
        fk_user_id: selectedRoom.fk_user_id,
        fk_room_id: selectedRoom.id,
        role: "user",
        message: content,
        referenced_message_id: referencedMessage?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("메시지 전송 실패:", error);
      return;
    }

    if (data) {
      addChat(data); // ✅ 상태에 직접 추가하여 채팅창에 즉시 반영
      clearReferencedMessage(); // 참조 메시지 초기화
      // rooms 테이블 updated_at 갱신
      await supabase
        .from("rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedRoom.id);
      handleGPT(content, selectedRoom.thread_id, selectedRoom.state);
    }
  };

  const handleGPT = async (message, threadId, idx) => {
    setIsLoading(true);
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_NODE_BASE_URL}/message`,
      {
        userMessage: message,
        threadId: threadId,
        type: idx,
      }
    );

    console.log(data);

    if (data.isNext) {
      const { data: updateResult } = await supabase
        .from("rooms")
        .update({ is_next: data.isNext })
        .eq("id", selectedRoom?.id)
        .select(`*,note(*)`)
        .single();

      setSelectedRoom(updateResult);
    }

    if (threadId === "") {
      const { data: result } = await supabase
        .from("rooms")
        .update({ thread_id: data.threadId })
        .eq("id", selectedRoom?.id)
        .select(`*,note(*)`)
        .single();

      setSelectedRoom(result);
    }
    // else {
    //   const { data: result1 } = await supabase
    //     .from("rooms")
    //     .update({ plan: data.plan })
    //     .eq("id", selectedRoom?.id)
    //     .select(`*,note(*)`)
    //     .single();

    //   setSelectedRoom(result1);
    // }

    const { data: gptData } = await supabase
      .from("chats")
      .insert({
        fk_user_id: selectedRoom?.fk_user_id,
        fk_room_id: selectedRoom?.id,
        role: "assistant",
        message: data.assistant,
        json: data.plan,
      })
      .select()
      .single();

    addChat(gptData);

    setIsLoading(false);
    // setIsNext(data.isNext);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 bg-[#F8FAFA]/0 mb-3">
      {/* 참조 메시지 표시 영역 */}
      {referencedMessage && (
        <div className="mb-2 p-3 bg-gray-100 rounded-lg border-l-4 border-blue-500">
          <div className="flex justify-between items-start mb-1">
            <span className="text-xs text-gray-600 font-medium">
              참조: {referencedMessage.role === "user" ? "Student" : "Faculty"}
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

      <div
        className={` w-full border border-gray-300 rounded-xl px-3 py-2 flex flex-col ${
          selectedRoom?.room_state ? "bg-white" : "bg-gray-200"
        }`}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)} // ⬅️ 조합 시작
          onCompositionEnd={() => setIsComposing(false)} // ⬅️ 조합 종료
          placeholder="Type a message..."
          className="w-full resize-none overflow-y-auto text-sm focus:outline-none max-h-[60px] mb-3"
          style={{ lineHeight: "20px" }}
          disabled={!selectedRoom?.room_state}
        />

        <div className="flex justify-between">
          <div className="flex gap-2">
            {selectedRoom?.is_next && (
              <div
                onClick={() => {
                  if (selectedRoom?.is_next) {
                    if (selectedRoom.state === 1) {
                      setNextModal(true);
                      // console.log("1");
                    } else if (selectedRoom.state === 2) {
                      // console.log("2");
                    }
                  }
                }}
                className={`text-sm px-3 py-1 rounded-xl ${
                  selectedRoom?.is_next
                    ? "bg-[#816eff] hover:bg-[#6B50FF] text-white cursor-pointer"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
              >
                Next
              </div>
            )}
            {/* {selectedRoom?.state === 3 && (
              <div className="text-sm px-3 py-1 rounded-xl bg-[#816eff] hover:bg-[#6B50FF] text-white cursor-pointer">
                🔥 Challenge Mode
              </div>
            )} */}
          </div>
          <div
            onClick={handleSend}
            className={`
              text-sm px-3 py-1 rounded-xl
              ${
                selectedRoom?.room_state
                  ? "bg-[#816eff] hover:bg-[#6B50FF] text-white cursor-pointer"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }
            `}
          >
            Send
          </div>
        </div>
      </div>
      {nextModal && (
        <SelectFaculty setNextModal={setNextModal} handleGPT={handleGPT} />
      )}
    </div>
  );
}
