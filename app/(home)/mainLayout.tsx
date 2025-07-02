import ChatPanel from "./chatPanel";
import LeftPanel from "./leftPanel";
import RightPanel from "./rightPanel";

export default function Layout() {
  return (
    <div className="flex h-[calc(100dvh-100px)] overflow-hidden">
      {/* Left Panel */}
      <LeftPanel />

      <div className="w-[1px] bg-gray-100" />

      {/* Chat Panel */}
      <div className="flex-1 h-full">
        <ChatPanel />
      </div>

      {/* Right Panel */}
      <RightPanel />
    </div>
  );
}
