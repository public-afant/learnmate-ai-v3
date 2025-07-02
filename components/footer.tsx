export default function Footer() {
  return (
    <div className="h-[40px] fixed bottom-0 left-0 w-full ">
      <div className="w-full h-[2px] bg-gray-100" />
      <div className="flex min-w-5xl mx-auto">
        <div className="h-[40px] flex items-center px-10">
          <span className="text-lg font-bold text-black/30 pr-3">
            LearnMate AI
          </span>
          <span className="px-3 text-black/30 text-sm">
            Copyright © Taejae University Education Planning Team
          </span>
          <span className="px-3 text-black/30 text-sm">
            Contact : eduplan@taejae.ac.kr
          </span>
        </div>
      </div>
    </div>
  );
}
