"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import UserModal from "@/app/components/UserModal";
import ChatViewer from "./chatViewer";

type User = any; // Assuming 'any' since we don't have types generated

export default function AdminTabs({ admins: initialAdmins, faculties: initialFaculties, students: initialStudents }: { admins: User[], faculties: User[], students: User[] }) {
  const [activeTab, setActiveTab] = useState<"admin" | "faculty" | "student" | "chat">("admin");
  const [admins, setAdmins] = useState<User[]>(initialAdmins);
  const [faculties, setFaculties] = useState<User[]>(initialFaculties);
  const [students, setStudents] = useState<User[]>(initialStudents);
  const supabase = createClient();

  // 모달 제어 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<"student" | "faculty" | "admin">("student");

  // 토글 상태 변경 핸들러
  const handleToggleState = async (role: "admin" | "faculty" | "student", user: User) => {
    // 활성 여부를 결정 (일반적으로 null 이거나 문자열/불리언 등 다양할 수 있음)
    // 데이터베이스 컬럼 타입이 boolean이므로 true / false를 명시적으로 사용합니다.
    const isCurrentlyActive = user.state === "active" || user.state === true; 
    const newState = !isCurrentlyActive; // boolean (true / false)

    // 낙관적 UI 업데이트 (UI 먼저 반영)
    const updateState = (prev: User[]) =>
      prev.map((u) => (u.id === user.id ? { ...u, state: newState } : u));
    
    if (role === "admin") setAdmins(updateState);
    if (role === "faculty") setFaculties(updateState);
    if (role === "student") setStudents(updateState);

    // Supabase DB 실제 업데이트 호출
    const { error } = await supabase
      .from("users")
      .update({ state: newState })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to update state:", error);
      alert("상태를 업데이트하는 중 오류가 발생했습니다.");
      // 에러 시 롤백
      const rollbackState = (prev: User[]) =>
        prev.map((u) => (u.id === user.id ? { ...u, state: user.state } : u));
      if (role === "admin") setAdmins(rollbackState);
      if (role === "faculty") setFaculties(rollbackState);
      if (role === "student") setStudents(rollbackState);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // 계정 편집 버튼 클릭
  const handleEditClick = (role: "student" | "faculty" | "admin", user: User) => {
    setEditingRole(role);
    setEditingUser(user);
    setIsModalOpen(true);
  };

  // 계정 저장(추가/수정) 로직
  const handleSaveUser = async (savedData: any) => {
    // 이미 존재하는 ID가 있다면 수정 (Update)
    if (savedData.id) {
      // 1-1. 수정 시 중복 코드(사번/학번) 검사 (본인 제외)
      const { data: existingCode } = await supabase
        .from("users")
        .select("id")
        .eq("code", savedData.code)
        .neq("id", savedData.id)
        .single();
        
      if (existingCode) {
        alert("이미 다른 계정에서 사용 중인 학번/사번/코드입니다.");
        throw new Error("Duplicate code");
      }
      const { error } = await supabase
        .from("users")
        .update({
          name: savedData.name,
          code: savedData.code,
          state: savedData.state,
        })
        .eq("id", savedData.id);

      if (error) {
        alert("계정 정보를 수정하는 중 오류가 발생했습니다.");
        throw error;
      }

      // 수정 성공 시 UI 반영
      const updateList = (prev: User[]) =>
        prev.map((s) => (s.id === savedData.id ? { ...s, ...savedData } : s));

      if (editingRole === "student") setStudents(updateList);
      if (editingRole === "faculty") setFaculties(updateList);
      if (editingRole === "admin") setAdmins(updateList);
    } else {
      // ID가 없다면 새로 추가 (Insert)
      // 2-1. 추가 시 이메일 중복 검사
      const { data: existingEmail } = await supabase
        .from("users")
        .select("id")
        .eq("email", savedData.email)
        .single();

      if (existingEmail) {
        alert("이미 존재하는 이메일입니다.");
        throw new Error("Duplicate email");
      }

      // 2-2. 추가 시 코드 중복 검사
      const { data: existingCode } = await supabase
        .from("users")
        .select("id")
        .eq("code", savedData.code)
        .single();

      if (existingCode) {
        alert("이미 존재하는 학번/사번/코드입니다.");
        throw new Error("Duplicate code");
      }
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            name: savedData.name,
            email: savedData.email,
            code: savedData.code,
            state: savedData.state,
            role: editingRole, // 모달을 연 주체의 role (faculty or student)
          },
        ])
        .select()
        .single();

      if (error) {
        alert("계정을 추가하는 중 오류가 발생했습니다.");
        console.error(error);
        throw error;
      }

      // 추가 성공 시 UI 반영
      if (data) {
        if (editingRole === "student") setStudents((prev) => [...prev, data]);
        if (editingRole === "faculty") setFaculties((prev) => [...prev, data]);
        if (editingRole === "admin") setAdmins((prev) => [...prev, data]);
      }
    }
  };

  // 계정 삭제 로직 (재확인 포함)
  const handleDeleteUser = async (role: "admin" | "faculty" | "student", user: User) => {
    const isConfirmed = window.confirm("정말로 이 계정을 삭제하시겠습니까?\n이 작업은 파기되며 되돌릴 수 없습니다.");
    if (!isConfirmed) return;

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id);

    if (error) {
      alert("계정을 삭제하는 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    // 성공 시 UI 즉시 파기 반영
    if (role === "admin") setAdmins((prev) => prev.filter((u) => u.id !== user.id));
    if (role === "faculty") setFaculties((prev) => prev.filter((u) => u.id !== user.id));
    if (role === "student") setStudents((prev) => prev.filter((u) => u.id !== user.id));
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-white text-sm overflow-hidden">
      {/* Sidebar Menu */}
      <div className="w-full md:w-60 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-5 flex-shrink-0 overflow-y-auto">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">관리 메뉴</h2>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("admin")}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all text-sm ${
              activeTab === "admin"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            관리자 목록 <span className="float-right text-[10px] opacity-80 mt-1">{admins.length}</span>
          </button>
          
          <button
            onClick={() => setActiveTab("faculty")}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all text-sm ${
              activeTab === "faculty"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            교수자 목록 <span className="float-right text-[10px] opacity-80 mt-1">{faculties.length}</span>
          </button>
          
          <button
            onClick={() => setActiveTab("student")}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all text-sm ${
              activeTab === "student"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            학생 목록 <span className="float-right text-[10px] opacity-80 mt-1">{students.length}</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all text-sm ${
              activeTab === "chat"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            채팅 조회
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 bg-white overflow-y-auto">
        <div className="mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-4">
            {activeTab === "admin" && "관리자 (Admins)"}
            {activeTab === "faculty" && "교수자 (Faculty)"}
            {activeTab === "student" && "학생 (Students)"}
            {activeTab === "chat" && "채팅 조회"}

            {activeTab !== "chat" && (
              <button
                onClick={() => {
                  setEditingRole(activeTab as "student" | "faculty" | "admin");
                  setEditingUser(null);
                  setIsModalOpen(true);
                }}
                className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                추가
              </button>
            )}
          </h3>
        </div>

        {/* List UI Table */}
        {activeTab === "chat" ? (
          <ChatViewer students={students} />
        ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden inline-block w-full max-w-4xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-600 w-1/4">이름</th>
                <th className="px-6 py-3 font-semibold text-gray-600 w-1/4">이메일</th>
                <th className="px-6 py-3 font-semibold text-gray-600 w-1/4">코드</th>
                <th className="px-6 py-3 font-semibold text-gray-600 w-1/4 text-center">계정 제어</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeTab === "admin" && admins.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">등록된 관리자가 없습니다.</td>
                </tr>
              )}
              {activeTab === "admin" && admins.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.code ? (
                      <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-700 border border-blue-100 text-xs">
                        {user.code}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => handleToggleState("admin", user)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                          user.state === "active" || user.state === true ? "bg-blue-600" : "bg-gray-300"
                        }`}
                        title={user.state === "active" || user.state === true ? "활성 상태" : "비활성 상태"}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            user.state === "active" || user.state === true ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleEditClick("admin", user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="정보 수정"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteUser("admin", user)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="계정 삭제"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === "faculty" && faculties.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">등록된 교수자가 없습니다.</td>
                </tr>
              )}
              {activeTab === "faculty" && faculties.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.code ? (
                      <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-700 border border-blue-100 text-xs">
                        {user.code}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => handleToggleState("faculty", user)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                          user.state === "active" || user.state === true ? "bg-blue-600" : "bg-gray-300"
                        }`}
                        title={user.state === "active" || user.state === true ? "활성 상태" : "비활성 상태"}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            user.state === "active" || user.state === true ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleEditClick("faculty", user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="정보 수정"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteUser("faculty", user)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="계정 삭제"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeTab === "student" && students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">등록된 학생이 없습니다.</td>
                </tr>
              )}
              {activeTab === "student" && students.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.code ? (
                      <span className="font-mono bg-emerald-50 px-2 py-1 rounded text-emerald-700 border border-emerald-100 text-xs">
                        {user.code}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => handleToggleState("student", user)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                          user.state === "active" || user.state === true ? "bg-blue-600" : "bg-gray-300"
                        }`}
                        title={user.state === "active" || user.state === true ? "활성 상태" : "비활성 상태"}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            user.state === "active" || user.state === true ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleEditClick("student", user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="정보 수정"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteUser("student", user)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="계정 삭제"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* User Add/Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUser}
        initialData={editingUser}
        role={editingRole}
      />
    </div>
  );
}
