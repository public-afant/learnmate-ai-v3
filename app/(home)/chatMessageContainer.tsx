"use client";

import GptMessage from "@/components/gptMessage";
import UserMessage from "@/components/userMessage";
import { useChatStore } from "@/store/chatStore";
import { useRoomStore } from "@/store/roomStore";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useRef } from "react";

export default function ChatMessageContainer({ isLoading, setIsLoading }) {
  const supabase = createClient();
  const { selectedRoom } = useRoomStore();
  const { setSelectedChat, selectedChat } = useChatStore();
  const containerRef = useRef<HTMLDivElement>(null);

  async function getChatList() {
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("fk_room_id", selectedRoom?.id)
      .order("created_at", { ascending: true });

    const fetchData = data ?? [];
    setSelectedChat(fetchData);
  }

  useEffect(() => {
    if (!selectedRoom?.id) return;
    getChatList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.id]);

  // useEffect(() => {
  //   getChatList();
  // }, [selectedChat]);

  useEffect(() => {
    const scrollToBottom = () => {
      const el = containerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    };

    // ✅ DOM 업데이트 이후 실행되도록 여러 번 시도
    setTimeout(scrollToBottom, 0);
    setTimeout(scrollToBottom, 100);
    setTimeout(scrollToBottom, 200);
  }, [selectedChat, isLoading]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-2 space-y-2 max-h-[calc(100vh-235px)] hide-scrollbar"
    >
      {selectedChat?.map((item) => {
        return item?.role === "user" ? (
          <UserMessage key={item.id} item={item} />
        ) : item?.role === "assistant" ? (
          <GptMessage key={item.id} item={item} setIsLoading={setIsLoading} />
        ) : null;
      })}
      {isLoading && (
        <div className="flex items-center gap-3 text-[#816eff] bg-[#816eff]/10 border border-[#816eff]/20 rounded-lg p-3 ml-2 mb-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-[#816eff]" />
          <span className="text-sm font-medium">
            {
              [
                "LearnMate is cooking up a smart reply...",
                "Give me a sec... I'm learning from your challenge!",
                "Crunching your challenge... with brain power!",
                "Your challenge has been accepted. Let me think...",
                "Thinking hard… because your challenge is a tough one!",
                "Beep boop... loading some smart thoughts!",
                "Downloading brainpower… please wait!",
                "One moment… your challenge made me think twice!",
                "Hold on, my brain just went on a coffee break... again.",
                "Teaching mode: activated. Common sense: still loading...",
                "Wait, which subject are we teaching again? Oh, right... everything!",
                "Currently fighting off squirrels in my neural network.",
                "Oops, I tried to take notes but got distracted by a dancing pixel.",
                "Hold tight, my imaginary assistant is assembling the lesson plans.",
                "Downloading your genius... oh no, it's mostly cat videos.",
                "I swear I understood that... give me five more seconds to pretend.",
                "Warning: brain cells partying. Learning is currently 73% confused.",
                "Recalculating... turns out knowledge is slippery like a greased penguin.",
              ][Math.floor(Math.random() * 18)]
            }
          </span>
        </div>
      )}
    </div>
  );
}
