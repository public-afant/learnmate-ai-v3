"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function UserCodeTag({
  initialCode,
  userId,
  hasEmail,
  isViewer,
}: {
  initialCode: string;
  userId: string;
  hasEmail: boolean;
  isViewer?: boolean;
}) {
  const [code, setCode] = useState(initialCode);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const supabase = createClient();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("클립보드 복사에 실패했습니다.");
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      // Generate a random 6-character code (lowercase + numbers)
      const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
      let newCode = "";
      for (let i = 0; i < 6; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Update the database
      const { error } = await supabase
        .from("users")
        .update({ code: newCode })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update code:", error);
        alert("코드 업데이트에 실패했습니다. (중복된 코드 등). 다시 시도해주세요.");
        return;
      }

      setCode(newCode);
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!code) return null;

  return (
    <div className="mr-3 flex items-center gap-1.5 px-2 py-0.5 bg-[#f0ecff] text-[#816eff] text-[11px] font-bold rounded-md border border-[#dfd8ff] tracking-wide relative group">
      <span>{code}</span>
      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center text-[#9c8eff] hover:text-[#6B50FF] transition-colors focus:outline-none"
          title="코드 복사"
        >
          {isCopied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981" // emerald-500
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>

        {hasEmail && !isViewer && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center text-[#9c8eff] hover:text-[#6B50FF] transition-colors focus:outline-none disabled:opacity-50"
            title="새로운 코드로 갱신"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isRefreshing ? "animate-spin" : ""}
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
