"use client";

import GptMessage from "@/components/gptMessage";
import UserMessage from "@/components/userMessage";
import { useChatStore } from "@/store/chatStore";
import { useRoomStore } from "@/store/roomStore";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useRef } from "react";

export default function ChatMessageContainer() {
  const supabase = createClient();
  const { selectedRoom } = useRoomStore();
  const { setSelectedChat, selectedChat } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const getChatList = async () => {
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("fk_room_id", selectedRoom?.id)
      .order("created_at", { ascending: true });

    setSelectedChat(data);
  };

  useEffect(() => {
    if (!selectedRoom?.id) return;
    getChatList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.id]);

  useEffect(() => {
    const scrollToBottom = () => {
      const el = containerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    };

    // ✅ DOM 업데이트 이후 실행되도록 약간 delay
    setTimeout(scrollToBottom, 0);
  }, [selectedChat]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-2 space-y-2 max-h-[calc(100vh-235px)] hide-scrollbar"
    >
      {selectedChat?.map((item) =>
        item.role === "user" ? (
          <UserMessage key={item.id} item={item} />
        ) : item.role === "assistant" ? (
          <GptMessage key={item.id} item={item} />
        ) : null
      )}
    </div>
  );
}
