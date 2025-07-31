"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useChallengeStore } from "@/store/challengeStore";
import { useRoomStore } from "@/store/roomStore";
import GptMessage from "./gptMessage";
import UserMessage from "./userMessage";
import axios from "axios";

const supabase = createClient();

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChallengeModal({
  isOpen,
  onClose,
}: ChallengeModalProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedRoom } = useRoomStore();
  const { challengeChats, setChallengeChats, addChallengeChat } =
    useChallengeStore();

  // 챌린지 채팅 목록 가져오기
  const getChallengeChatList = async () => {
    if (!selectedRoom?.id) return;

    // 챌린지 전용 테이블에서 채팅 가져오기
    const { data } = await supabase
      .from("challenge_chats")
      .select("*")
      .eq("fk_room_id", selectedRoom.id)
      .order("created_at", { ascending: true })
      .limit(50); // 최근 50개 메시지만 가져오기

    setChallengeChats(data || []);
  };

  // 챌린지 모드 첫 진입 시 초기 데이터 전송
  const sendInitialChallengeData = async () => {
    if (!selectedRoom?.id) return;

    // 이미 초기화되었는지 확인하고 즉시 플래그 설정
    if (hasInitialized) return;
    setHasInitialized(true);

    // 1. 기존 일반 채팅 내용 가져오기
    const { data: existingChats } = await supabase
      .from("chats")
      .select("*")
      .eq("fk_room_id", selectedRoom.id)
      .order("created_at", { ascending: true })
      .limit(20); // 최근 20개 메시지만

    // 2. 학습계획서 가져오기
    const planData = selectedRoom.plan;

    // 3. 초기 컨텍스트 메시지 생성
    let contextMessage =
      "챌린지 모드에 진입했습니다. 다음 정보를 바탕으로 도전적인 질문을 해주세요:\n\n";

    // 학습계획서 정보 추가
    if (planData) {
      contextMessage += "📋 **학습계획서 정보:**\n";
      contextMessage += `- 프로젝트명: ${planData.project_name}\n`;
      contextMessage += `- 프로젝트 설명: ${planData.project_description}\n`;
      contextMessage += `- 추천 학습 자료: ${planData.recommended_learning_materials?.join(
        ", "
      )}\n\n`;
    }

    // 기존 대화 내용 추가
    if (existingChats && existingChats.length > 0) {
      contextMessage += "💬 **기존 대화 내용:**\n";
      existingChats.forEach((chat, index) => {
        const role = chat.role === "user" ? "학생" : "AI";
        contextMessage += `${index + 1}. [${role}] ${chat.message}\n`;
      });
      contextMessage += "\n";
    }

    contextMessage +=
      "이제 위의 정보를 바탕으로 학생의 이해도를 테스트하고 심화 학습을 도울 수 있는 도전적인 질문이나 문제를 제시해주세요.";

    // 초기 컨텍스트 메시지를 챌린지 채팅에 저장
    const { data: contextChat } = await supabase
      .from("challenge_chats")
      .insert({
        fk_user_id: selectedRoom.fk_user_id,
        fk_room_id: selectedRoom.id,
        role: "assistant",
        message: contextMessage,
      })
      .select()
      .single();

    if (contextChat) {
      addChallengeChat(contextChat);
    }
  };

  useEffect(() => {
    if (isOpen && selectedRoom?.id) {
      getChallengeChatList();
    } else {
      // 모달이 닫힐 때 초기화 플래그 리셋
      setHasInitialized(false);
    }
  }, [isOpen, selectedRoom?.id]);

  // 챌린지 채팅이 로드된 후 초기 데이터 전송 (한 번만 실행)
  useEffect(() => {
    if (
      isOpen &&
      selectedRoom?.id &&
      challengeChats.length === 0 &&
      !hasInitialized
    ) {
      sendInitialChallengeData();
    }
  }, [challengeChats.length, isOpen, selectedRoom?.id, hasInitialized]);

  // 텍스트 영역 높이 자동 조정
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 3 * 20;
      textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + "px";
    }
  }, [message]);

  // 채팅창 스크롤 자동 하단 이동
  useEffect(() => {
    const scrollToBottom = () => {
      const el = containerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    };
    setTimeout(scrollToBottom, 0);
  }, [challengeChats]);

  const handleSend = async () => {
    if (!selectedRoom?.room_state || !message.trim()) return;

    const content = message.trim();
    setMessage("");

    // 사용자 메시지 저장 (챌린지 전용 테이블)
    const { data, error } = await supabase
      .from("challenge_chats")
      .insert({
        fk_user_id: selectedRoom.fk_user_id,
        fk_room_id: selectedRoom.id,
        role: "user",
        message: content,
      })
      .select()
      .single();

    if (error) {
      console.error("메시지 전송 실패:", error);
      return;
    }

    if (data) {
      addChallengeChat(data);

      // rooms 테이블 updated_at 갱신
      await supabase
        .from("rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedRoom.id);

      handleGPT(content, selectedRoom.thread_id, 4); // 챌린지 모드는 idx 4 사용
    }
  };

  const handleGPT = async (
    message: string,
    threadId: string,
    idx: number = 4
  ) => {
    setIsLoading(true);

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_NODE_BASE_URL}/message`,
        {
          userMessage: `[Challenge Mode] ${message}`,
          threadId: selectedRoom?.bot4_thread_id || threadId,
          type: idx,
          isChallenge: true,
        }
      );

      // GPT 응답 저장 (챌린지 전용 테이블)
      const { data: result } = await supabase
        .from("challenge_chats")
        .insert({
          fk_user_id: selectedRoom?.fk_user_id,
          fk_room_id: selectedRoom?.id,
          message: data.assistant,
          role: "assistant",
          json: data.plan,
        })
        .select()
        .single();

      if (result) {
        addChallengeChat(result);
      }

      // bot4_thread_id 업데이트 (챌린지 모드용)
      if (data.threadId) {
        await supabase
          .from("rooms")
          .update({ bot4_thread_id: data.threadId })
          .eq("id", selectedRoom?.id);
      }
    } catch (error) {
      console.error("GPT 응답 처리 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      if (!isLoading) handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 top-0 left-0 h-full w-full bg-[#00000064] flex justify-center items-center">
      <div className="w-[900px] h-[800px] bg-white rounded-xl flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-[#816eff]/10 to-[#6B50FF]/10">
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-pulse">🔥</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Challenge Mode
              </h2>
              <p className="text-sm text-gray-600">
                {selectedRoom?.isChallenge
                  ? "Challenge mode is active! Test your knowledge with advanced questions."
                  : "Test your knowledge and skills with advanced questions"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 채팅 메시지 컨테이너 */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-[600px] hide-scrollbar"
        >
          {challengeChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-8xl mb-6 animate-bounce">🔥</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Challenge Mode
              </h3>
              <p className="text-gray-600 max-w-md mb-4">
                Ready to test your knowledge? Ask challenging questions, solve
                complex problems, and push your limits!
              </p>
              <div className="bg-[#816eff]/10 border border-[#816eff]/20 rounded-lg p-4 max-w-md">
                <p className="text-sm text-[#816eff]">
                  💡 <strong>Tip:</strong> Try asking questions like "Explain
                  this concept in detail" or "What are the advanced applications
                  of this topic?"
                </p>
              </div>
            </div>
          ) : (
            challengeChats.map((item) => {
              return item?.role === "user" ? (
                <UserMessage key={item.id} item={item} />
              ) : item?.role === "assistant" ? (
                <GptMessage
                  key={item.id}
                  item={item}
                  setIsLoading={setIsLoading}
                />
              ) : null;
            })
          )}
          {isLoading && (
            <div className="flex items-center gap-3 text-[#816eff] bg-[#816eff]/10 border border-[#816eff]/20 rounded-lg p-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-[#816eff]" />
              <span className="text-sm font-medium">
                AI is analyzing your challenge...
              </span>
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="p-6 border-t border-gray-200">
          <div className="w-full border border-gray-300 rounded-xl px-4 py-3 flex flex-col bg-white">
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="Ask a challenging question, solve a complex problem, or request advanced explanations..."
              className="w-full resize-none overflow-y-auto text-sm focus:outline-none max-h-[60px] mb-3"
              style={{ lineHeight: "20px" }}
              disabled={!selectedRoom?.room_state || isLoading}
            />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>🔥 Challenge Mode</span>
                <span>•</span>
                <span>Press Enter to send</span>
              </div>
              <button
                onClick={() => {
                  if (!isLoading) handleSend();
                }}
                className={`
                  text-sm px-4 py-2 rounded-xl font-medium
                  ${
                    selectedRoom?.room_state && !isLoading && message.trim()
                      ? "bg-[#816eff] hover:bg-[#6B50FF] text-white cursor-pointer shadow-md"
                      : "bg-gray-300 text-gray-400 cursor-not-allowed opacity-70"
                  }
                `}
                style={{
                  pointerEvents: isLoading ? "none" : "auto",
                  transition: "background 0.2s, color 0.2s, opacity 0.2s",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
