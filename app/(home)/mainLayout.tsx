import ChatPanel from "./chatPanel";
import LeftPanel from "./(left)/leftPanel";
import RightPanel from "./rightPanel";

export default function Layout({ isViewer }: { isViewer?: boolean }) {
  return (
    <div className="flex h-[calc(100dvh-100px)] overflow-hidden">
      {/* Left Panel */}
      <LeftPanel />

      <div className="w-[1px] bg-gray-100" />

      {/* Chat Panel */}
      <div className="flex-1 h-full min-w-[330px]">
        <ChatPanel isViewer={isViewer} />
      </div>

      {/* Right Panel */}
      <RightPanel isViewer={isViewer} />
    </div>
  );
}
