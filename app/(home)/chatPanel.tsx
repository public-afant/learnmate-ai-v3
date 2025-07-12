import Chat from "./chat";
import ChatHeader from "./chatHeader";

export default function ChatPanel() {
  return (
    <div className="relative h-full flex flex-col pt-1 items-center">
      {/* 헤더는 전체 폭 */}
      <div className="w-full">
        <ChatHeader />
      </div>
      {/* 중앙 정렬된 본문 영역 */}
      <div className="flex flex-col flex-1 items-center justify-end w-full  bg-[#F8FAFA]">
        <div className="w-full max-w-full flex flex-col flex-1 overflow-hidden">
          {/* 메시지 영역 */}
          <Chat />
        </div>
      </div>
    </div>
  );
}
