import RoomList from "@/components/room-list";
import { cookies } from "next/headers";

export default async function LeftPanel() {
  const token = (await cookies()).get("auth_token");

  return (
    <div className=" w-[250px] max-w-[250px] p-1">
      <div className="flex justify-between p-3">
        <div className="text-[14px] font-bold flex items-center">
          My Learning Spaces
        </div>
        <div className="bg-[#6B50FF] px-3 py-1 rounded-xl text-white text-[12px] cursor-pointer">
          Create
        </div>
      </div>
      <RoomList token={token} />
    </div>
  );
}
