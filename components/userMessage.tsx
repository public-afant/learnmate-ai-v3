import formatChatTimestamp from "@/utils/formatChatTimestamp";

export default function UserMessage({ item }) {
  const { time } = formatChatTimestamp(item.created_at);

  return (
    <div className="flex justify-end mr-3 my-5 ">
      <div className="flex justify-end items-end flex-col text-[10px] mr-2 text-gray-400">
        <div className="mt-[-4px]">{time}</div>
      </div>
      <div className="max-w-full bg-[#EDEEFC] px-4 py-3 rounded-t-xl rounded-bl-xl text-sm flex items-center">
        {item.message}
      </div>
    </div>
  );
}
