"use client";

import { useState, useEffect } from "react";

type User = any; // We'll keep using any since we don't have generated types

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: any) => Promise<void>;
  initialData: User | null; // null if adding, User object if editing
  role: "student" | "faculty" | "admin"; // Role determines wording inside the modal
}

export default function UserModal({ isOpen, onClose, onSave, initialData, role }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    code: "",
    state: true, // true (active), false (inactive)
  });
  const [isLoading, setIsLoading] = useState(false);

  // 모달이 열리거나 initialData가 바뀔 때 폼 초기화
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          email: initialData.email || "",
          code: initialData.code || "",
          state: initialData.state === "active" || initialData.state === true,
        });
      } else {
        setFormData({
          name: "",
          email: "",
          code: "",
          state: true,
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // 이름, 학번(코드) 필수값 체크
    if (!formData.name.trim() || !formData.code.trim()) {
      alert(`이름과 ${role === "student" ? "학번/코드" : "사번/코드"}는 필수 입력 항목입니다.`);
      setIsLoading(false);
      return;
    }

    try {
      await onSave({
        ...initialData, // 기존 수정이면 id 유지
        name: formData.name,
        email: formData.email,
        code: formData.code,
        state: formData.state,
      });
      onClose(); // 성공 시 모달 닫기
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">
            {initialData 
              ? `${role === "student" ? "학생" : role === "faculty" ? "교수자" : "관리자"} 정보 수정`
              : `새로운 ${role === "student" ? "학생" : role === "faculty" ? "교수자" : "관리자"} 추가`
            }
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">이름 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-gray-400 text-sm"
              placeholder={`${role === "student" ? "학생" : role === "faculty" ? "교수자" : "관리자"} 이름을 입력하세요`}
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">이메일</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-gray-400 text-sm"
              placeholder={`${role === "student" ? "student" : role === "faculty" ? "faculty" : "admin"}@example.com`}
              disabled={!!initialData} // 이메일은 보통 기본 키/계정이므로 수정 불가하게 막음 (기획에 따라 풀 수 있음)
            />
            {initialData && <p className="text-xs text-gray-400 mt-1">※ 등록된 이메일은 변경할 수 없습니다.</p>}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              {role === "student" ? "학번/코드" : "사번/코드"} <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-gray-400 text-sm font-mono"
              placeholder="예: 20240001"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="text-sm font-semibold text-gray-700">계정 활성화 상태</label>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, state: !formData.state })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                formData.state ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.state ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-semibold transition-colors border border-gray-200 text-sm"
            >
              취소
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/30 text-sm disabled:opacity-50 flex justify-center items-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "저장하기"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
