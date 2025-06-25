export default function Footer() {
  return (
    // <div className="absolute bottom-0 left-0 h-8 flex ">
    //   <div className="flex justify-center max-w-[1750px] min-w-5xl mx-auto">
    //     <span className="">LearnMate AI</span>
    //     <span className="px-3">
    //       Copyright © Taejae University Education Planning Team
    //     </span>
    //     <span className="px-3">Contact : eduplan@taejae.ac.kr</span>
    //   </div>
    // </div>

    <div className="h-[40px] fixed bottom-0 left-0 w-full ">
      <div className="flex max-w-[1750px] min-w-5xl mx-auto">
        <div className="h-[40px] flex items-center px-10">
          <span className="text-xl font-bold text-black/30 pr-3">
            LearnMate AI
          </span>
          <span className="px-3 text-black/30">
            Copyright © Taejae University Education Planning Team
          </span>
          <span className="px-3 text-black/30">
            Contact : eduplan@taejae.ac.kr
          </span>
        </div>
      </div>
    </div>
  );
}
