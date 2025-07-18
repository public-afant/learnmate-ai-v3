"use client";

import { useChatStore } from "@/store/chatStore";
import { useRoomStore } from "@/store/roomStore";
import FilterJson from "@/utils/filterJson";
import formatChatTimestamp from "@/utils/formatChatTimestamp";
import { createClient } from "@/utils/supabase/client";
import axios from "axios";
import { useRef, useEffect, useState } from "react";
// import { useReplyStore } from "@/store/replyStore";

export default function GptMessage({
  item,
  setIsLoading,
}: {
  item: any;
  setIsLoading: any;
}) {
  const { time } = formatChatTimestamp(item.created_at);
  const [isModal, setIsModal] = useState(false);
  // const [referencedMessage, setReferencedMessage] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const supabase = createClient();
  const messageRef = useRef<HTMLDivElement>(null);
  // const { setReferencedMessage: setReplyReference } = useReplyStore();

  // window.scrollToGptMessage 등록 (최초 1회만)
  useEffect(() => {
    if (!(window as any).gptMessageRefs) {
      (window as any).gptMessageRefs = {};
    }
    (window as any).gptMessageRefs[String(item.id)] = messageRef;
    if (!(window as any).scrollToGptMessage) {
      (window as any).scrollToGptMessage = (id: string) => {
        const ref = (window as any).gptMessageRefs?.[String(id)];

        if (ref && ref.current) {
          ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };
    }
    return () => {
      if ((window as any).gptMessageRefs) {
        delete (window as any).gptMessageRefs[String(item.id)];
      }
    };
  }, [item.id]);

  const { message } = FilterJson(item.message);

  // useEffect(() => {
  //   async function fetchReferencedMessage() {
  //     if (!item.referenced_message_id) return;
  //     const { data } = await supabase
  //       .from("chats")
  //       .select("id, message, role")
  //       .eq("id", item.referenced_message_id)
  //       .single();
  //     if (data) {
  //       setReferencedMessage(data);
  //     }
  //   }
  //   fetchReferencedMessage();
  // }, [item.referenced_message_id]);

  // const handleReply = () => {
  //   setReplyReference({
  //     id: item.id,
  //     message: item.message,
  //     role: item.role,
  //     created_at: item.created_at,
  //   });
  // };

  return (
    <div
      ref={messageRef}
      className="flex justify-start mr-10 my-5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-[70%] bg-[#d3d5fc] px-4 py-3 rounded-xl text-sm flex flex-col items-start whitespace-pre-wrap relative">
        <div>{ConvertFunction(message)}</div>
        {item.json !== null && (
          <div
            onClick={() => setIsModal(true)}
            className="cursor-pointer mt-2 px-2 py-1  rounded-sm bg-[#816eff] hover:bg-[#6B50FF] text-white text-sm"
          >
            Show Plan
          </div>
        )}
      </div>
      <div className="flex justify-end items-end flex-col text-[10px] ml-2 text-gray-400 relative">
        <div className="flex items-center gap-1 mt-[-4px]">
          <span>{time}</span>
          {/* Reply 버튼 제거 */}
        </div>
      </div>
      {isModal && (
        <PlanModal
          json={item.json}
          setIsModal={setIsModal}
          setIsLoading={setIsLoading}
        />
      )}
    </div>
  );
}

const ConvertFunction = (content) => {
  content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // ### 제목 변환
  content = content.replace(/### (.*?)(\n|$)/g, "<h3>$1</h3>");
  // **굵게** 변환
  content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // *기울임* 변환
  content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");

  return <div dangerouslySetInnerHTML={{ __html: content }} />;
};

const supabase = createClient();

export function PlanModal({ json, setIsModal, setIsLoading }) {
  const { selectedRoom, setSelectedRoom } = useRoomStore();
  // const { selectedChat } = useChatStore();
  const { addChat } = useChatStore();
  const handleConfirm = async () => {
    // 1. 챗봇 3로 넘어가야함
    // 2. 쓰래드ID 비우기
    // 3. 플랜 업데이트,채팅 방 이름 변경
    const { data, error } = await supabase
      .from("rooms")
      .update({
        state: 3,
        thread_id: "",
        plan: json,
        title: json.project_name,
      })
      .eq("id", selectedRoom?.id)
      .select(`*,note(*)`)
      .single();

    setSelectedRoom(data);
    setIsModal(false);
    window.dispatchEvent(new Event("refreshRooms"));
    handleGPT(json, "", 3);

    // 3. 선택방 초기화 -> 플랜 탭 확인
  };

  const handleGPT = async (plan, threadId, idx) => {
    setIsLoading(true);
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_NODE_BASE_URL}/message`,
      {
        userMessage: JSON.stringify(plan),
        threadId: threadId,
        type: idx,
      }
    );

    const { data: room } = await supabase
      .from("rooms")
      .update({ thread_id: data.threadId })
      .eq("id", selectedRoom?.id)
      .select(`*,note(*)`)
      .single();
    setSelectedRoom(room);

    const { data: result } = await supabase
      .from("chats")
      .insert({
        fk_user_id: selectedRoom?.fk_user_id,
        fk_room_id: selectedRoom?.id,
        message: data.assistant,
        role: "assistant",
        json: data.plan,
      })
      .select()
      .single();
    addChat(result);
    // rooms 테이블 updated_at 갱신
    await supabase
      .from("rooms")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", selectedRoom?.id);
    setIsLoading(false);
  };

  return (
    <div className="fixed z-10 top-0 left-0  h-full w-full bg-[#00000064] flex justify-center items-center">
      <div className="w-[600px] h-[700px] bg-white rounded-xl p-5">
        <div className="flex justify-end">
          <div
            onClick={() => setIsModal(false)}
            className="mr-2 px-3 py-1 bg-[#ffffff] hover:bg-[#e4e0ff] border-[1.5px] border-[#816eff] text-[#816eff] text-sm rounded-sm cursor-pointer"
          >
            Cancel
          </div>
          <div
            onClick={handleConfirm}
            className="px-3 py-1 bg-[#816eff] hover:bg-[#6B50FF] text-white text-sm rounded-sm cursor-pointer"
          >
            Confirm
          </div>
        </div>
        <div className="pb-2 text-sm text-gray-700 space-y-6 h-[630px] w-full overflow-y-auto ">
          {/* Top info */}
          <div>
            <div className="text-xs text-gray-400">Project Name</div>
            <div className="text-lg font-semibold">{json.project_name}</div>
          </div>

          {/* Project Description */}
          <div>
            <div className="text-xs text-gray-400 mb-1">
              Project Description
            </div>
            <p>{json.project_description}</p>
          </div>

          {/* Recommended Materials */}
          <div>
            <div className="text-xs text-gray-400 mb-1">
              Recommended Learning Materials
            </div>
            <ul className="list-disc ml-4">
              {json.recommended_learning_materials.map(
                (mat: string, idx: number) => (
                  <li key={idx}>{mat}</li>
                )
              )}
            </ul>
          </div>

          {/* Learning Plan Table */}
          <div>
            <div className="text-xs text-gray-400 mb-2">
              Project Description
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed border border-gray-200 text-left text-sm">
                <thead className="bg-gray-100 text-gray-500">
                  <tr>
                    <th className="p-2 w-[80px] border">Week</th>
                    <th className="p-2 border">Inquiry Question</th>
                    <th className="p-2 border">Reference Materials</th>
                    <th className="p-2 border">Learning Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {json.learning_plan.map((item) => (
                    <tr key={item.week} className="align-top">
                      <td className="p-2 border font-medium text-gray-600">
                        Week{item.week}
                      </td>
                      <td className="p-2 border">{item.inquiry_question}</td>
                      <td className="p-2 border whitespace-pre-line">
                        {item.reference_materials.map(
                          (r: string) => `- ${r}\n`
                        )}
                      </td>
                      <td className="p-2 border">{item.learning_activity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
