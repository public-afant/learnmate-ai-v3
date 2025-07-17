"use client";
import { useState } from "react";
import ChatHeader from "./chatHeader";
import ChatMessageContainer from "./chatMessageContainer";
import ChatInput from "./chatInput";

export default function ChatPanel() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="relative h-full flex flex-col pt-1 items-center">
      {/* 헤더는 전체 폭 */}
      <div className="w-full">
        <ChatHeader />
      </div>
      {/* 중앙 정렬된 본문 영역 */}
      <div className="flex flex-col flex-1 items-center justify-end w-full bg-[#F8FAFA] min-h-0">
        <div className="w-full max-w-full flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* 메시지 영역 + 입력창을 flex로 분리, InstructorChatTab과 동일하게 */}
          <div className="flex flex-col flex-1 min-h-0 p-1 gap-3">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ChatMessageContainer
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
            <div className="flex-shrink-0 mt-0">
              <ChatInput setIsLoading={setIsLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
