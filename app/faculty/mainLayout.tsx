import ChatPanel from "./chatPanel";
import LeftPanel from "./leftPanel";
import RightPanel from "./rightPanel";

interface LayoutProps {
  userId: string;
}

export default function Layout({ userId }: LayoutProps) {
  return (
    <div className="flex h-[calc(100dvh-100px)] overflow-hidden">
      {/* Left Panel */}
      <LeftPanel userId={userId} />

      <div className="w-[1px] bg-gray-100" />

      {/* Chat Panel */}
      <div className="flex-1 h-full bg-[#F8FAFA] min-w-[330px]">
        <ChatPanel userId={userId} />
      </div>

      {/* Right Panel */}
      <RightPanel />
    </div>
  );
}
