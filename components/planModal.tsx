import { useChatStore } from "@/store/chatStore";
import { useRoomStore } from "@/store/roomStore";
import { createClient } from "@/utils/supabase/client";
import axios from "axios";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface LearningPlanItem {
  week: number;
  inquiry_question: string;
  reference_materials: string[];
  learning_activity: string;
}

interface PlanJson {
  [key: string]: any;
}

interface PlanModalProps {
  json: PlanJson;
  setIsModal: Dispatch<SetStateAction<boolean>> | (() => void);
  setIsLoading?: Dispatch<SetStateAction<boolean>>;
  hideConfirm?: boolean;
  date?: string;
}

export default function PlanModal({
  json,
  setIsModal,
  setIsLoading,
  hideConfirm,
  date,
}: PlanModalProps) {
  const { selectedRoom, setSelectedRoom } = useRoomStore();
  const { addChat } = useChatStore();
  const supabase = createClient();
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
    const { data } = await supabase
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
  };

  const handleGPT = async (plan: PlanJson, threadId: string, idx: number) => {
    if (!setIsLoading) return;
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
    await supabase
      .from("rooms")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", selectedRoom?.id);
    setIsLoading(false);
  };

  return (
    <div className="fixed z-10 top-0 left-0  h-full w-full bg-[#00000064] flex justify-center items-center">
      <div className="w-[700px] h-[700px] bg-white rounded-xl p-5">
        <div className="flex justify-end">
          <div
            onClick={() => setIsModal(false)}
            className="mr-2 px-3 py-1 bg-[#ffffff] hover:bg-[#e4e0ff] border-[1.5px] border-[#816eff] text-[#816eff] text-sm rounded-sm cursor-pointer"
          >
            Cancel
          </div>
          {!hideConfirm && (
            <div
              onClick={handleConfirm}
              className="px-3 py-1 bg-[#816eff] hover:bg-[#6B50FF] text-white text-sm rounded-sm cursor-pointer"
            >
              Confirm
            </div>
          )}
        </div>
        <div className="pb-2 text-sm text-gray-700 space-y-6 h-[630px] w-full overflow-y-auto ">
          {/* ==================================================== */}
          {/* NEW: Project Summary Report UI (Stage 2) */}
          {/* ==================================================== */}
          {!!json.projectIdentity && (
            <div className="space-y-8 pb-10">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Project Summary Report</h1>
                <div className="flex justify-end border-b-2 border-slate-800 pb-6 mb-4">
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
                      <td className="py-3 px-4 bg-slate-50 font-semibold text-slate-700 w-1/3 border-r border-slate-200">Project Title</td>
                      <td className="py-3 px-4 text-slate-800 font-medium italic">{json.projectIdentity.projectTitle}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-3 px-4 bg-slate-50 font-semibold text-slate-700 w-1/3 border-r border-slate-200">Civic Category</td>
                      <td className="py-3 px-4 text-slate-800">{json.projectIdentity.civicCategory}</td>
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
                      <li><span className="font-semibold text-slate-800">Methodological Justification:</span> {json.researchDesignAndMethodology.proposedMethodology.methodologicalJustification}</li>
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

          {/* ==================================================== */}
          {/* LEGACY: Learning Plan UI (Option 1 Fallback)       */}
          {/* ==================================================== */}
          {!!json.learning_plan && (
            <>
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
                  <table className="min-w-full border border-gray-200 text-left text-sm table-fixed">
                    <colgroup>
                      <col style={{ width: "70px" }} />
                      <col style={{ width: "180px" }} />
                      <col style={{ width: "200px" }} />
                      <col style={{ width: "250px" }} />
                    </colgroup>
                    <thead className="bg-gray-100 text-gray-500">
                      <tr>
                        <th className="p-2 border break-words">Week</th>
                        <th className="p-2 border break-words">Inquiry Question</th>
                        <th className="p-2 border break-words">
                          Reference Materials
                        </th>
                        <th className="p-2 border break-words">
                          Learning Activity
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {json.learning_plan.map((item: LearningPlanItem) => (
                        <tr key={item.week} className="align-top">
                          <td className="p-2 border font-medium text-gray-600 break-words">
                            Week{item.week}
                          </td>
                          <td className="p-2 border break-words whitespace-pre-line">
                            {item.inquiry_question}
                          </td>
                          <td className="p-2 border break-words whitespace-pre-line">
                            {item.reference_materials.map(
                              (r: string, idx: number) => (
                                <div key={idx}>- {r}</div>
                              )
                            )}
                          </td>
                          <td className="p-2 border break-words whitespace-pre-line">
                            {item.learning_activity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
