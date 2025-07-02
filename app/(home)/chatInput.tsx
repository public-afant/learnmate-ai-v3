"use client";

import { useState, useRef, useEffect } from "react";

export default function ChatInput() {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 3 * 20; // assuming line-height ~20px for text-sm
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
    }
  }, [message]);

  return (
    <div className="px-4 py-2 bg-[#F8FAFA]">
      <div className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 flex flex-col">
        <textarea
          ref={textareaRef}
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full resize-none overflow-y-auto text-sm focus:outline-none max-h-[60px]" // 3 lines x 20px
          style={{ lineHeight: "20px" }}
        />

        <div className="flex justify-end">
          <div className="text-sm px-3 py-1 bg-[#816eff] hover:bg-[#6B50FF] text-white rounded-xl cursor-pointer">
            Send
          </div>
        </div>
      </div>
    </div>
  );
}
