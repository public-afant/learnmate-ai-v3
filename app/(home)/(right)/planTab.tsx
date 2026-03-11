"use client";

// import { useRoomStore } from "@/store/roomStore";

export default function PlanTab({ selectedRoom }) {
  // const { selectedRoom } = useRoomStore();
  const plan = selectedRoom?.plan;

  if (!plan || Object.keys(plan).length === 0) {
    return (
      <div className="p-6 text-gray-500 text-sm">No project summaries or learning plans available.</div>
    );
  }

  // --- 🌟 Option 1: Backwards Compatibility Checks ---
  // 구버전(Learning Plan)인지 신버전(Project Summary Report)인지 판별합니다.
  const isLegacyPlan = !!plan.learning_plan;
  const isNewReport = !!plan.projectIdentity;

  return (
    <div className="p-6 text-sm text-gray-700 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
      
      {/* ==================================================== */}
      {/* NEW: Project Summary Report UI (Stage 2) */}
      {/* ==================================================== */}
      {isNewReport && (
        <div className="space-y-8 pb-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Project Summary Report</h1>
            <div className="flex justify-end border-b-2 border-slate-800 pb-6 mb-4">
              <div className="text-right text-[13px] text-slate-800 space-y-1">
                <div><span className="font-bold">Course:</span> CIVIC Project: Korea (2026 Spring)</div>
                <div><span className="font-bold">System Generation:</span> LearnMate AI 3.1</div>
                <div><span className="font-bold">Date:</span> {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '. ')}</div>
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
                  <td className="py-3 px-4 text-slate-800 font-medium italic">{plan.projectIdentity.projectTitle}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-3 px-4 bg-slate-50 font-semibold text-slate-700 w-1/3 border-r border-slate-200">Civic Category</td>
                  <td className="py-3 px-4 text-slate-800">{plan.projectIdentity.civicCategory}</td>
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
              <p className="pl-4 text-slate-700 leading-relaxed text-[13px]">{plan.executiveSummary.problemDefinitionAndSignificance}</p>
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
                <p className="pl-4 text-slate-700 leading-relaxed text-[13px]">{plan.contextualBackground.previousInitiatives}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-sm"></div> Key References
                </h3>
                <ul className="list-decimal pl-9 text-[13px] text-slate-700 space-y-1.5 marker:text-slate-400 marker:font-semibold">
                  {plan.contextualBackground.keyReferences.map((ref: string, idx: number) => (
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
                  <li><span className="font-semibold text-slate-800">Primary Method:</span> {plan.researchDesignAndMethodology.proposedMethodology.primaryMethod}</li>
                  <li><span className="font-semibold text-slate-800">Methodological Justification:</span> {plan.researchDesignAndMethodology.proposedMethodology.methodologicalJustification}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-600 rounded-sm"></div> Action Roadmap
                </h3>
                <ul className="list-disc pl-9 text-[13px] text-slate-700 space-y-1.5 marker:text-indigo-400">
                  <li><span className="font-semibold text-slate-800">Step 1 (Exploration):</span> {plan.researchDesignAndMethodology.actionRoadmap.step1Exploration}</li>
                  <li><span className="font-semibold text-slate-800">Step 2 (Engagement):</span> {plan.researchDesignAndMethodology.actionRoadmap.step2Engagement}</li>
                  <li><span className="font-semibold text-slate-800">Step 3 (Synthesis):</span> {plan.researchDesignAndMethodology.actionRoadmap.step3Synthesis}</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ==================================================== */}
      {/* LEGACY: Learning Plan UI (Option 1 Fallback)       */}
      {/* ==================================================== */}
      {isLegacyPlan && (
        <>
          {/* Top info */}
          <div>
            <div className="text-xs text-gray-400">Project Name</div>
            <div className="text-lg font-semibold">{plan.project_name}</div>
            <div className="text-xs text-right text-gray-400 mt-1">
              Date of creation : {plan.date || "N/A"}
            </div>
          </div>

          {/* Project Description */}
          <div>
            <div className="text-xs text-gray-400 mb-1">Project Description</div>
            <p className="leading-relaxed">{plan.project_description}</p>
          </div>

          {/* Recommended Materials */}
          <div>
            <div className="text-xs text-gray-400 mb-1">
              Recommended Learning Materials
            </div>
            <ul className="list-disc ml-4 space-y-1">
              {plan.recommended_learning_materials?.map(
                (mat: string, idx: number) => (
                  <li key={idx}>{mat}</li>
                )
              )}
            </ul>
          </div>

          {/* Learning Plan Table */}
          <div>
            <div className="text-xs text-gray-400 mb-2">Project Description</div>
            <div className="overflow-x-auto rounded-md shadow-sm">
              <table className="min-w-full border border-gray-200 text-left text-sm table-fixed">
                <colgroup>
                  <col style={{ width: "70px" }} />
                  <col style={{ width: "180px" }} />
                  <col style={{ width: "200px" }} />
                  <col style={{ width: "250px" }} />
                </colgroup>
                <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="p-3 border-r break-words">Week</th>
                    <th className="p-3 border-r break-words">Inquiry Question</th>
                    <th className="p-3 border-r break-words">Reference Materials</th>
                    <th className="p-3 break-words">Learning Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {plan.learning_plan?.map((item: any) => (
                    <tr key={item.week} className="align-top hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 border-r font-medium text-gray-700 break-words bg-gray-50/30">
                        Week{item.week}
                      </td>
                      <td className="p-3 border-r break-words whitespace-pre-line text-gray-600">
                        {item.inquiry_question}
                      </td>
                      <td className="p-3 border-r break-words whitespace-pre-line text-gray-600 space-y-1">
                        {item.reference_materials?.map((r: string, idx: number) => (
                          <div key={idx} className="flex gap-1.5 text-xs">
                            <span className="text-gray-400">-</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </td>
                      <td className="p-3 break-words whitespace-pre-line text-gray-600">
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

      {/* Button Toolset (Common) */}
      <div className="*:cursor-pointer flex justify-end pt-4 mt-6 border-t border-gray-100">
        <div
          className="mr-3 bg-[#816eff] px-5 py-2 rounded-full text-white text-xs font-semibold hover:bg-[#6B50FF] shadow-sm transition-all hover:shadow-md"
          onClick={() => window.open("https://scholar.google.com/", "_blank")}
        >
          Google Scholar
        </div>
        <div
          className="bg-[#816eff] px-5 py-2 rounded-full text-white text-xs font-semibold hover:bg-[#6B50FF] shadow-sm transition-all hover:shadow-md"
          onClick={() => window.open("https://library.taejae.ac.kr/", "_blank")}
        >
          TJ Library
        </div>
      </div>
    </div>
  );
}
