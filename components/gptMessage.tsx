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
          date={item.created_at}
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

export function PlanModal({ json, setIsModal, setIsLoading, date }) {
  const { selectedRoom, setSelectedRoom } = useRoomStore();
  // const { selectedChat } = useChatStore();
  const { addChat } = useChatStore();
  const [instructorName, setInstructorName] = useState<string>("");

  useEffect(() => {
    async function fetchInstructor() {
      if (!selectedRoom?.id) return;
      const { data: inviteData } = await supabase
        .from("invite")
        .select("fk_user_faculty_id")
        .eq("fk_room_id", selectedRoom.id)
        .eq("state", true) // Assuming the invite is accepted
        .single();

      if (inviteData?.fk_user_faculty_id) {
        const { data: userData } = await supabase
          .from("users")
          .select("name")
          .eq("id", inviteData.fk_user_faculty_id)
          .single();
        if (userData) {
          setInstructorName(userData.name);
        }
      }
    }
    fetchInstructor();
  }, [selectedRoom?.id]);

  const handleConfirm = async () => {
    // 1. 챗봇 3로 넘어가야함
    // 2. 쓰래드ID 비우기
    // 3. 플랜 업데이트,채팅 방 이름 변경
    
    // 신버전(Project Summary Report) vs 구버전(Learning Plan) 타이틀 호환성 처리
    const roomTitle = json?.projectIdentity?.projectTitle || json?.project_name || "Unknown Project";

    const { data, error } = await supabase
      .from("rooms")
      .update({
        state: 3,
        thread_id: "",
        plan: json,
        title: roomTitle,
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

  const isLegacyPlan = !!json?.learning_plan;
  const isNewReport = !!json?.projectIdentity;

  return (
    <div className="fixed z-10 top-0 left-0 h-full w-full bg-[#00000064] flex justify-center items-center">
      <div className="w-[800px] h-[750px] bg-white rounded-xl p-6 flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Review Output</h2>
          <div className="flex gap-2">
            {selectedRoom && selectedRoom.state >= 3 ? (
              <div
                onClick={() => setIsModal(false)}
                className="px-4 py-1.5 bg-[#816eff] hover:bg-[#6B50FF] text-white font-medium text-sm rounded-md cursor-pointer shadow-sm transition-all"
              >
                Close
              </div>
            ) : (
              <>
                <div
                  onClick={() => setIsModal(false)}
                  className="px-4 py-1.5 bg-[#ffffff] hover:bg-[#e4e0ff] border-[1.5px] border-[#816eff] text-[#816eff] font-medium text-sm rounded-md cursor-pointer transition-colors"
                >
                  Cancel
                </div>
                <div
                  onClick={handleConfirm}
                  className="px-4 py-1.5 bg-[#816eff] hover:bg-[#6B50FF] text-white font-medium text-sm rounded-md cursor-pointer shadow-sm transition-all"
                >
                  Confirm
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 pb-4 hide-scrollbar">
          {isNewReport && (
            <div className="space-y-8 pb-4">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6 mt-2">Project Summary Report</h1>
                <div className="flex justify-end border-b-2 border-slate-800 pb-4 mb-4">
                  <div className="text-right text-[13px] text-slate-800 space-y-1">
                    <div><span className="font-bold">Course:</span> CIVIC Project: Korea (2026 Spring)</div>
                    <div><span className="font-bold">System Generation:</span> LearnMate AI 3.1</div>
                    <div><span className="font-bold">Instructor:</span> {instructorName || "Not assigned yet"}</div>
                    <div><span className="font-bold">Date:</span> {new Date(date || new Date()).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '. ')}</div>
                  </div>
                </div>
              </div>
    
              {/* 1. Project Identity */}
              <section>
                <h2 className="text-[15px] font-bold text-slate-800 mb-3 border-l-4 border-indigo-500 pl-2">1. Project Identity</h2>
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    <tr className="border-y border-slate-200">
                      <td className="py-2.5 px-3 bg-slate-50 font-semibold text-slate-700 w-1/3 border-r border-slate-200">Project Title</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium italic">{json.projectIdentity.projectTitle}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-2.5 px-3 bg-slate-50 font-semibold text-slate-700 w-1/3 border-r border-slate-200">Civic Category</td>
                      <td className="py-2.5 px-3 text-slate-800">{json.projectIdentity.civicCategory}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
    
              {/* 2. Executive Summary */}
              <section>
                <h2 className="text-[15px] font-bold text-slate-800 mb-3 border-l-4 border-indigo-500 pl-2">2. Executive Summary (The 'Why')</h2>
                <div className="pl-3">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-600 rounded-sm"></div> Problem Definition & Significance
                  </h3>
                  <p className="pl-4 text-slate-700 leading-relaxed text-[13px]">{json.executiveSummary.problemDefinitionAndSignificance}</p>
                </div>
              </section>
    
              {/* 3. Contextual Background */}
              <section>
                <h2 className="text-[15px] font-bold text-slate-800 mb-3 border-l-4 border-indigo-500 pl-2">3. Contextual Background (The 'Evidence')</h2>
                <div className="space-y-4 pl-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-600 rounded-sm"></div> Previous Initiatives
                    </h3>
                    <p className="pl-4 text-slate-700 leading-relaxed text-[13px]">{json.contextualBackground.previousInitiatives}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-600 rounded-sm"></div> Key References
                    </h3>
                    <ul className="list-decimal pl-9 text-[13px] text-slate-700 space-y-1.5 marker:text-slate-400 marker:font-semibold">
                      {json.contextualBackground.keyReferences.map((ref: string, idx: number) => (
                        <li key={idx} className="leading-snug">{ref}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
    
              {/* 4. Research Design & Methodology */}
              <section>
                <h2 className="text-[15px] font-bold text-slate-800 mb-3 border-l-4 border-indigo-500 pl-2">4. Research Design & Methodology (The 'How')</h2>
                <div className="space-y-5 pl-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-600 rounded-sm"></div> Proposed Methodology
                    </h3>
                    <ul className="list-disc pl-9 text-[13px] text-slate-700 space-y-1.5 marker:text-indigo-400">
                      <li><span className="font-semibold text-slate-800">Primary Method:</span> {json.researchDesignAndMethodology.proposedMethodology.primaryMethod}</li>
                      <li><span className="font-semibold text-slate-800">Justification:</span> {json.researchDesignAndMethodology.proposedMethodology.methodologicalJustification}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-600 rounded-sm"></div> Action Roadmap
                    </h3>
                    <ul className="list-disc pl-9 text-[13px] text-slate-700 space-y-1.5 marker:text-indigo-400">
                      <li><span className="font-semibold text-slate-800">Step 1 (Exploration):</span> {json.researchDesignAndMethodology.actionRoadmap.step1Exploration}</li>
                      <li><span className="font-semibold text-slate-800">Step 2 (Engagement):</span> {json.researchDesignAndMethodology.actionRoadmap.step2Engagement}</li>
                      <li><span className="font-semibold text-slate-800">Step 3 (Synthesis):</span> {json.researchDesignAndMethodology.actionRoadmap.step3Synthesis}</li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          )}

          {isLegacyPlan && (
            <div className="text-sm text-gray-700 space-y-6 w-full">
              <div>
                <div className="text-xs text-gray-400">Project Name</div>
                <div className="text-lg font-semibold">{json.project_name}</div>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1">Project Description</div>
                <p>{json.project_description}</p>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-1">Recommended Learning Materials</div>
                <ul className="list-disc ml-4">
                  {json.recommended_learning_materials?.map((mat: string, idx: number) => (
                    <li key={idx}>{mat}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs text-gray-400 mb-2">Project Description</div>
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
                      {json.learning_plan?.map((item: any) => (
                        <tr key={item.week} className="align-top">
                          <td className="p-2 border font-medium text-gray-600">Week{item.week}</td>
                          <td className="p-2 border">{item.inquiry_question}</td>
                          <td className="p-2 border whitespace-pre-line">
                            {item.reference_materials?.map((r: string) => `- ${r}\n`)}
                          </td>
                          <td className="p-2 border">{item.learning_activity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
