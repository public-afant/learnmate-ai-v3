"use client";

import FilterJson from "@/utils/filterJson";
import formatChatTimestamp from "@/utils/formatChatTimestamp";
import { useState } from "react";

export default function GptMessage({ item }) {
  const { date, time } = formatChatTimestamp(item.created_at);
  const [isModal, setIsModal] = useState(true);

  const { message, json } = FilterJson(item.message);

  return (
    <div className="flex justify-start mr-10 my-5">
      <div className=" max-w-full bg-[#d3d5fc] px-4 py-3 rounded-xl text-sm flex flex-col items-start whitespace-pre-wrap">
        <div>{ConvertFunction(message)}</div>
        {/* {json !== undefined && <div>asdf</div>} */}
      </div>
      <div className="flex justify-end items-end flex-col text-[10px] ml-2 text-gray-400">
        <div className="mt-[-4px]">{time}</div>
      </div>
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
