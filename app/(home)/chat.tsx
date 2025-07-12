"use client";

import { createClient } from "@/utils/supabase/client";
import ChatInput from "./chatInput";
import ChatMessageContainer from "./chatMessageContainer";
import { useRoomStore } from "@/store/roomStore";
import { useChatStore } from "@/store/chatStore";
import { useEffect, useState } from "react";

const supabase = createClient();

export default function Chat() {
  const { selectedRoom } = useRoomStore();
  const { setSelectedChat } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <>
      {/* {selectedRoom?.state === 2 ? (
        <div className="flex flex-col items-center mt-10">
          <div>
            <Image src={"/ic-approval.png"} width={400} height={100} alt="ic" />
          </div>
          <div className="font-bold text-[20px]">
            &quot;We are waiting for approval!!&quot;
          </div>
        </div>
      ) : (
        <>
          <ChatMessageContainer />
          <ChatInput />
        </>
      )} */}
      <ChatMessageContainer isLoading={isLoading} setIsLoading={setIsLoading} />
      <ChatInput setIsLoading={setIsLoading} />
    </>
  );
}
