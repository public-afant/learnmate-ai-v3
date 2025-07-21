"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRoomStore } from "@/store/roomStore";
import Image from "next/image";

const supabase = createClient();

interface LeftPanelProps {
  userId: string;
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default function LeftPanel({ userId }: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<"rooms" | "invites">("rooms");
  const [rooms, setRooms] = useState<any[]>([]);
  const [studentNames, setStudentNames] = useState<{
    [roomId: string]: string;
  }>({});
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteRoomMap, setInviteRoomMap] = useState<{ [roomId: string]: any }>(
    {}
  );
  const [inviteStudentMap, setInviteStudentMap] = useState<{
    [userId: string]: string;
  }>({});
  const { setSelectedRoom, selectedRoom } = useRoomStore();

  async function getRoomList() {
    const { data } = await supabase
      .from("rooms")
      .select("*, invite:invite!inner(fk_user_faculty_id, state)")
      .eq("invite.fk_user_faculty_id", userId)
      .eq("invite.state", true)
      .order("updated_at", { ascending: false });
    setRooms(data ?? []);
  }

  async function getInvites() {
    // 1. 미승인 invite만 조회
    const { data: inviteData } = await supabase
      .from("invite")
      .select("*, fk_room_id, fk_user_id, created_at")
      .eq("fk_user_faculty_id", userId)
      .eq("state", false)
      .order("created_at", { ascending: false });
    setInvites(inviteData ?? []);

    // 2. 방 정보 병렬 조회
    if (inviteData && inviteData.length > 0) {
      const roomIds = inviteData.map((i) => i.fk_room_id);
      const userIds = inviteData.map((i) => i.fk_user_id);
      const { data: roomData } = await supabase
        .from("rooms")
        .select("id, title")
        .in("id", roomIds);
      const { data: userData } = await supabase
        .from("users")
        .select("id, name")
        .in("id", userIds);
      const roomMap: { [roomId: string]: any } = {};
      roomData?.forEach((room) => {
        roomMap[room.id] = room;
      });
      setInviteRoomMap(roomMap);
      const userMap: { [userId: string]: string } = {};
      userData?.forEach((user) => {
        userMap[user.id] = user.name;
      });
      setInviteStudentMap(userMap);
    } else {
      setInviteRoomMap({});
      setInviteStudentMap({});
    }
  }

  async function approveInvite(inviteId: string) {
    // 1. 초대 승인
    await supabase.from("invite").update({ state: true }).eq("id", inviteId);

    // 2. invite row에서 roomId, studentId, facultyId 조회
    const { data: inviteRow } = await supabase
      .from("invite")
      .select("fk_room_id, fk_user_id, fk_user_faculty_id")
      .eq("id", inviteId)
      .single();

    if (inviteRow) {
      // 3. system 메시지 insert
      await supabase.from("faculty_student_chats").insert({
        fk_room_id: inviteRow.fk_room_id,
        fk_student_id: inviteRow.fk_user_id,
        fk_faculty_id: inviteRow.fk_user_faculty_id,
        sender_role: "system",
        message: `You have accepted the student’s request.\nPlease start the conversation.`,
        created_at: new Date(),
      });
    }

    getInvites();
    getRoomList(); // 승인 시 Rooms 탭도 갱신
  }

  async function rejectInvite(inviteId: string) {
    await supabase.from("invite").delete().eq("id", inviteId);
    getInvites();
  }

  // 학생 이름 병렬로 가져오기
  useEffect(() => {
    async function fetchStudentNames() {
      if (!rooms.length) return;
      const ids = rooms.map((room) => room.fk_user_id);
      const { data } = await supabase
        .from("users")
        .select("id, name")
        .in("id", ids);
      const nameMap: { [roomId: string]: string } = {};
      data?.forEach((user) => {
        nameMap[user.id] = user.name;
      });
      setStudentNames(nameMap);
    }
    fetchStudentNames();
  }, [rooms]);

  // 방 목록이 바뀌면 첫 번째 방 자동 선택
  useEffect(() => {
    if (rooms.length > 0) {
      setSelectedRoom(rooms[0]);
    }
  }, [rooms]);

  useEffect(() => {
    if (activeTab === "rooms") {
      getRoomList();
    } else if (activeTab === "invites") {
      getInvites();
    }
  }, [activeTab, userId]);

  const TABS = [
    { key: "rooms", label: "Rooms" },
    { key: "invites", label: "Invites" },
  ];

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* 탭 헤더 */}
      <div className="flex justify-around px-2 border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as "rooms" | "invites")}
            className={`relative z-0 px-3 py-3 font-medium text-sm ${
              activeTab === tab.key
                ? "text-black font-semibold"
                : "text-gray-400"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-400 rounded-full" />
            )}
          </button>
        ))}
      </div>
      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-auto p-2 text-sm">
        {activeTab === "rooms" && (
          <div>
            {rooms.length === 0 ? (
              <div className="text-gray-400 p-4">No rooms found.</div>
            ) : (
              <ul>
                {rooms.map((room) => (
                  <li
                    key={room.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition ${
                      selectedRoom?.id === room.id ? "bg-gray-100" : ""
                    }`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="flex-shrink-0">
                      <Image
                        src={`/ic-state-${room.state ?? 1}.png`}
                        width={40}
                        height={40}
                        style={{ width: 40, height: 40 }}
                        alt="state"
                        className="rounded"
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {room.title}
                      </div>
                      {/* <div className="text-xs text-gray-400 font-semibold truncate">
                        {formatDate(room.updated_at)}
                      </div> */}
                      <div className="text-xs text-gray-400 truncate">
                        {studentNames[room.fk_user_id] || "-"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {activeTab === "invites" && (
          <div className="p-1">
            {invites.length === 0 ? (
              <div className="text-gray-400">No pending invites.</div>
            ) : (
              <ul className="space-y-3">
                {invites.map((invite, idx) => (
                  <li key={invite.id} className="bg-white p-1 flex flex-col ">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="font-bold text-[14px] text-black truncate">
                        {inviteRoomMap[invite.fk_room_id]?.title || "-"}
                      </div>
                      <div className="font-bold text-xs text-gray-500 truncate">
                        {inviteStudentMap[invite.fk_user_id] || "-"}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {formatDate(invite.created_at)}
                      </div>
                    </div>
                    <div className="flex gap-1 min-w-[60px] justify-end">
                      <span
                        className="text-[#ff5656] hover:text-[#ff3636] font-semibold text-xs cursor-pointer hover:underline mr-3"
                        onClick={() => rejectInvite(invite.id)}
                      >
                        Deny
                      </span>
                      <span
                        className="text-[#6B50FF] hover:text-[#816eff] font-semibold text-xs cursor-pointer hover:underline"
                        onClick={() => approveInvite(invite.id)}
                      >
                        Accept
                      </span>
                    </div>
                    <div className="w-full h-[1px] bg-gray-100 mt-2" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
