import { useChatStore } from "@/store/chatStore";
import { useRoomStore } from "@/store/roomStore";
import { createClient } from "@/utils/supabase/client";
import axios from "axios";
import { Dispatch, SetStateAction } from "react";

interface LearningPlanItem {
  week: number;
  inquiry_question: string;
  reference_materials: string[];
  learning_activity: string;
}

interface PlanJson {
  project_name: string;
  project_description: string;
  recommended_learning_materials: string[];
  learning_plan: LearningPlanItem[];
}

interface PlanModalProps {
  json: PlanJson;
  setIsModal: Dispatch<SetStateAction<boolean>> | (() => void);
  setIsLoading?: Dispatch<SetStateAction<boolean>>;
  hideConfirm?: boolean;
}

export default function PlanModal({
  json,
  setIsModal,
  setIsLoading,
  hideConfirm,
}: PlanModalProps) {
  const { selectedRoom, setSelectedRoom } = useRoomStore();
  const { addChat } = useChatStore();
  const supabase = createClient();

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
        </div>
      </div>
    </div>
  );
}
