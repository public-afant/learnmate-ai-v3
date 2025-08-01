"use client";

// import { useRoomStore } from "@/store/roomStore";

export default function PlanTab({ selectedRoom }) {
  // const { selectedRoom } = useRoomStore();
  const plan = selectedRoom?.plan;

  if (!plan || Object.keys(plan).length === 0) {
    return (
      <div className="p-6 text-gray-500 text-sm">학습 계획이 없습니다.</div>
    );
  }

  return (
    <div className="p-6 text-sm text-gray-700 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Top info */}
      <div>
        <div className="text-xs text-gray-400">Project Name</div>
        <div className="text-lg font-semibold">{plan.project_name}</div>
        <div className="text-xs text-right text-gray-400 mt-1">
          Date of creation : {plan.date}
        </div>
      </div>

      {/* Project Description */}
      <div>
        <div className="text-xs text-gray-400 mb-1">Project Description</div>
        <p>{plan.project_description}</p>
      </div>

      {/* Recommended Materials */}
      <div>
        <div className="text-xs text-gray-400 mb-1">
          Recommended Learning Materials
        </div>
        <ul className="list-disc ml-4">
          {plan.recommended_learning_materials.map(
            (mat: string, idx: number) => (
              <li key={idx}>{mat}</li>
            )
          )}
        </ul>
      </div>

      {/* Learning Plan Table */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Project Description</div>
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
                <th className="p-2 border break-words">Reference Materials</th>
                <th className="p-2 border break-words">Learning Activity</th>
              </tr>
            </thead>
            <tbody>
              {plan.learning_plan.map((item: any) => (
                <tr key={item.week} className="align-top">
                  <td className="p-2 border font-medium text-gray-600 break-words">
                    Week{item.week}
                  </td>
                  <td className="p-2 border break-words whitespace-pre-line">
                    {item.inquiry_question}
                  </td>
                  <td className="p-2 border break-words whitespace-pre-line">
                    {item.reference_materials.map((r: string, idx: number) => (
                      <div key={idx}>- {r}</div>
                    ))}
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
      <div className="*:cursor-pointer flex justify-end">
        <div
          className="mr-3 bg-[#816eff] px-4 py-2 rounded-full text-white hover:bg-[#6B50FF]"
          onClick={() => window.open("https://scholar.google.com/", "_blank")}
        >
          Google Scholar
        </div>
        <div
          className="bg-[#816eff] px-4 py-2 rounded-full text-white hover:bg-[#6B50FF]"
          onClick={() => window.open("https://library.taejae.ac.kr/", "_blank")}
        >
          TJ Library
        </div>
      </div>
    </div>
  );
}
