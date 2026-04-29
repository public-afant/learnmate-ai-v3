"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type User = any;
type Room = any;
type Chat = any;
type CheckedRoom = { room: Room; student: User };

function triggerCSVDownload(filename: string, chats: Chat[], includeAssistant: boolean) {
  const filtered = includeAssistant ? chats : chats.filter((c: Chat) => c.role === "user");
  const rows = [
    ["학생", "시간", "역할", "메시지"],
    ...filtered.map((c: Chat) => [
      c._studentName ?? "",
      new Date(c.created_at).toLocaleString("ko-KR"),
      c.role === "user" ? "학생" : "AI",
      c.message,
    ]),
  ];
  const csv = rows
    .map((r) => r.map((v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ChatViewer({ students }: { students: User[] }) {
  const supabase = createClient();

  // 날짜 필터
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const filterRooms = (rooms: Room[]) => {
    if (!filterFrom && !filterTo) return rooms;
    return rooms.filter((r) => {
      if (!r.updated_at) return false;
      const d = r.updated_at.slice(0, 10); // "YYYY-MM-DD"
      if (filterFrom && d < filterFrom) return false;
      if (filterTo && d > filterTo) return false;
      return true;
    });
  };

  // 트리 상태
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loadedRooms, setLoadedRooms] = useState<Map<string, Room[]>>(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // 선택 상태: roomId → { room, student }
  const [checkedRooms, setCheckedRooms] = useState<Map<string, CheckedRoom>>(new Map());

  // 뷰어 상태
  const [viewRoom, setViewRoom] = useState<Room | null>(null);
  const [viewStudent, setViewStudent] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  // 다운로드 메뉴
  const [showSingleMenu, setShowSingleMenu] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  // 학생 펼치기 (rooms lazy load)
  const toggleExpand = async (student: User) => {
    const isOpen = expandedIds.has(student.id);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      isOpen ? next.delete(student.id) : next.add(student.id);
      return next;
    });
    if (!isOpen && !loadedRooms.has(student.id)) {
      setLoadingIds((prev) => new Set([...prev, student.id]));
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("fk_user_id", student.id)
        .order("updated_at", { ascending: false });
      setLoadedRooms((prev) => new Map([...prev, [student.id, data || []]]));
      setLoadingIds((prev) => { const n = new Set(prev); n.delete(student.id); return n; });
    }
  };

  // 학생 체크 (rooms 없으면 먼저 로드)
  const toggleCheckStudent = async (student: User, e: React.MouseEvent) => {
    e.stopPropagation();
    let rooms = loadedRooms.get(student.id);
    if (!rooms) {
      setLoadingIds((prev) => new Set([...prev, student.id]));
      setExpandedIds((prev) => new Set([...prev, student.id]));
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("fk_user_id", student.id)
        .order("updated_at", { ascending: false });
      rooms = data || [];
      setLoadedRooms((prev) => new Map([...prev, [student.id, rooms!]]));
      setLoadingIds((prev) => { const n = new Set(prev); n.delete(student.id); return n; });
    }
    const allChecked = rooms.length > 0 && rooms.every((r) => checkedRooms.has(r.id));
    setCheckedRooms((prev) => {
      const next = new Map(prev);
      if (allChecked) rooms!.forEach((r) => next.delete(r.id));
      else rooms!.forEach((r) => next.set(r.id, { room: r, student }));
      return next;
    });
  };

  // 방 체크
  const toggleCheckRoom = (room: Room, student: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedRooms((prev) => {
      const next = new Map(prev);
      next.has(room.id) ? next.delete(room.id) : next.set(room.id, { room, student });
      return next;
    });
  };

  // 방 클릭 → 뷰어
  const handleViewRoom = async (room: Room, student: User) => {
    setViewRoom(room);
    setViewStudent(student);
    setLoadingChats(true);
    const { data } = await supabase
      .from("chats")
      .select("*")
      .eq("fk_room_id", room.id)
      .order("created_at", { ascending: true });
    setChats(data || []);
    setLoadingChats(false);
  };

  // 학생 체크 상태
  const studentCheckState = (student: User): "all" | "some" | "none" => {
    const rooms = loadedRooms.get(student.id) || [];
    if (rooms.length === 0) return "none";
    const n = rooms.filter((r) => checkedRooms.has(r.id)).length;
    if (n === 0) return "none";
    return n === rooms.length ? "all" : "some";
  };

  // 단일 다운로드
  const downloadSingle = (includeAssistant: boolean) => {
    if (!viewRoom || !viewStudent) return;
    const suffix = includeAssistant ? "전체" : "학생만";
    triggerCSVDownload(
      `${viewStudent.name}_${viewRoom.title || "제목없음"}_${suffix}.csv`,
      chats,
      includeAssistant
    );
    setShowSingleMenu(false);
  };

  // 일괄 다운로드
  const bulkDownload = async (includeAssistant: boolean) => {
    if (checkedRooms.size === 0) return;
    setBulkDownloading(true);
    setShowBulkMenu(false);
    const suffix = includeAssistant ? "전체" : "학생만";
    for (const [roomId, { room, student }] of checkedRooms) {
      const { data } = await supabase
        .from("chats")
        .select("*")
        .eq("fk_room_id", roomId)
        .order("created_at", { ascending: true });
      if (!data || data.length === 0) continue;
      // 학생 이름 컬럼용
      const enriched = data.map((c: Chat) => ({ ...c, _studentName: student.name }));
      triggerCSVDownload(
        `${student.name}_${room.title || "제목없음"}_${suffix}.csv`,
        enriched,
        includeAssistant
      );
      await new Promise((r) => setTimeout(r, 400));
    }
    setBulkDownloading(false);
  };

  const checkedCount = checkedRooms.size;

  return (
    <div className="flex h-[calc(100vh-260px)] border border-gray-200 rounded-lg overflow-hidden">
      {/* 트리 패널 */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col overflow-hidden bg-white">
        {/* 트리 헤더 */}
        <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0 flex items-center justify-between bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            학생 / 채팅방
            {checkedCount > 0 && (
              <span className="ml-2 text-blue-600 normal-case font-medium">
                {checkedCount}개 선택
              </span>
            )}
          </p>

          {checkedCount > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBulkMenu((v) => !v)}
                disabled={bulkDownloading}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {bulkDownloading ? (
                  "다운로드 중..."
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    일괄 다운로드
                  </>
                )}
              </button>
              {showBulkMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowBulkMenu(false)} />
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                    <p className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      {checkedCount}개 채팅방 · 형식 선택
                    </p>
                    <button
                      onClick={() => bulkDownload(false)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <p className="font-medium text-sm text-gray-700">학생 대화만</p>
                      <p className="text-xs text-gray-400 mt-0.5">학생 메시지만 포함</p>
                    </button>
                    <button
                      onClick={() => bulkDownload(true)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-700">전체 대화 포함</p>
                      <p className="text-xs text-gray-400 mt-0.5">AI 답변도 함께 포함</p>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 날짜 필터 */}
        <div className="px-3 py-2.5 border-b border-gray-200 flex-shrink-0 flex items-center gap-1.5 bg-white">
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-600 focus:outline-none focus:border-gray-400"
          />
          <span className="text-gray-400 text-xs flex-shrink-0">~</span>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 text-gray-600 focus:outline-none focus:border-gray-400"
          />
          {(filterFrom || filterTo) && (
            <button
              onClick={() => { setFilterFrom(""); setFilterTo(""); }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              title="필터 초기화"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 트리 목록 */}
        <div className="overflow-y-auto flex-1">
          {students.length === 0 && (
            <p className="px-4 py-6 text-xs text-gray-400 text-center">학생이 없습니다.</p>
          )}
          {students.map((student) => {
            const isOpen = expandedIds.has(student.id);
            const isLoading = loadingIds.has(student.id);
            const rooms = filterRooms(loadedRooms.get(student.id) || []);
            const checkState = studentCheckState(student);

            const checkedInStudent = rooms.filter((r) => checkedRooms.has(r.id)).length;

            return (
              <div key={student.id} className="border-b border-gray-200">
                {/* 학생 행 */}
                <div
                  className="flex items-center gap-2 px-3 py-3 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(student)}
                >
                  <span className="flex-shrink-0 text-gray-400">
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>

                  <div className="flex-shrink-0" onClick={(e) => toggleCheckStudent(student, e)}>
                    <input
                      type="checkbox"
                      checked={checkState === "all"}
                      ref={(el) => { if (el) el.indeterminate = checkState === "some"; }}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 pointer-events-none"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 truncate">{student.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{student.code || "-"}</p>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    {isLoading && <span className="text-[10px] text-gray-400">로딩중</span>}
                    {checkedInStudent > 0 && (
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        {checkedInStudent}
                      </span>
                    )}
                  </div>
                </div>

                {/* 방 목록 — 트리 라인 */}
                {isOpen && !isLoading && (
                  <div className="ml-7">
                    {rooms.length === 0 ? (
                      <p className="pl-4 py-3 text-[11px] text-gray-400">채팅방 없음</p>
                    ) : (
                      rooms.map((room) => {
                        const isChecked = checkedRooms.has(room.id);
                        const isViewing = viewRoom?.id === room.id;
                        return (
                          <div
                            key={room.id}
                            className="flex items-center pl-4 pr-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleViewRoom(room, student)}
                          >
                            <div className="mr-2.5 flex-shrink-0" onClick={(e) => toggleCheckRoom(room, student, e)}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 pointer-events-none"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-normal truncate ${isViewing ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                                {room.title || "제목 없음"}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {room.updated_at
                                  ? new Date(room.updated_at).toLocaleDateString("ko-KR")
                                  : "-"}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 채팅 뷰어 */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* 뷰어 헤더 */}
        <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
          <div>
            {viewRoom ? (
              <>
                <p className="font-semibold text-gray-800 text-sm">
                  {viewRoom.title || "제목 없음"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {viewStudent?.name} · {chats.length}개 메시지
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">채팅방을 클릭하면 대화를 볼 수 있습니다.</p>
            )}
          </div>

          {viewRoom && chats.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowSingleMenu((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                다운로드
              </button>
              {showSingleMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSingleMenu(false)} />
                  <div className="absolute right-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                    <p className="px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      다운로드 형식 선택
                    </p>
                    <button
                      onClick={() => downloadSingle(false)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                      <p className="font-medium text-sm text-gray-700">학생 대화만</p>
                      <p className="text-xs text-gray-400 mt-0.5">학생 메시지만 포함</p>
                    </button>
                    <button
                      onClick={() => downloadSingle(true)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-700">전체 대화 포함</p>
                      <p className="text-xs text-gray-400 mt-0.5">AI 답변도 함께 포함</p>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!viewRoom ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-gray-400">왼쪽에서 채팅방을 클릭하면 대화 내용이 표시됩니다.</p>
            </div>
          ) : loadingChats ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-gray-400">불러오는 중...</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-gray-400">대화 내용이 없습니다.</p>
            </div>
          ) : (
            chats.map((chat: Chat) => (
              <div
                key={chat.id}
                className={`flex ${chat.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                    chat.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-700 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{chat.message}</p>
                  <p
                    className={`text-[10px] mt-1.5 ${
                      chat.role === "user" ? "text-blue-200 text-right" : "text-gray-400"
                    }`}
                  >
                    {new Date(chat.created_at).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
