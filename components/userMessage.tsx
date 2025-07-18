import formatChatTimestamp from "@/utils/formatChatTimestamp";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function UserMessage({ item }: { item: any }) {
  const { time } = formatChatTimestamp(item.created_at);
  const [referencedMessage, setReferencedMessage] = useState<any>(null);
  const supabase = createClient();
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!(window as any).gptMessageRefs) {
      (window as any).gptMessageRefs = {};
    }
    (window as any).gptMessageRefs[String(item.id)] = messageRef;
    return () => {
      if ((window as any).gptMessageRefs) {
        delete (window as any).gptMessageRefs[String(item.id)];
      }
    };
  }, [item.id]);

  useEffect(() => {
    async function fetchReferencedMessage() {
      if (!item.referenced_message_id) return;

      const { data } = await supabase
        .from("chats")
        .select("id, message, role")
        .eq("id", item.referenced_message_id)
        .single();

      if (data) {
        setReferencedMessage(data);
      }
    }

    fetchReferencedMessage();
  }, [item.referenced_message_id]);

  return (
    <div ref={messageRef} className="flex justify-end mr-3 my-5 ">
      <div className="flex justify-end items-end flex-col text-[10px] mr-2 text-gray-400">
        <div className="mt-[-4px]">{time}</div>
      </div>
      <div className="max-w-[70%] bg-[#EDEEFC] px-4 py-3 rounded-t-xl rounded-bl-xl text-sm flex flex-col">
        {referencedMessage && (
          <div
            className="mb-2 p-2 bg-gray-50 rounded-lg border-l-2 border-blue-400 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => {
              if ((window as any).scrollToGptMessage) {
                (window as any).scrollToGptMessage(item.referenced_message_id);
              }
            }}
          >
            <div className="text-xs text-gray-500 mb-1">
              참조: {referencedMessage.role === "user" ? "학생" : "GPT"}
            </div>
            <div className="text-xs text-gray-700 line-clamp-2">
              {referencedMessage.message}
            </div>
          </div>
        )}
        <div>{item.message}</div>
      </div>
    </div>
  );
}
