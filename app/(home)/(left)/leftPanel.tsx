import { cookies } from "next/headers";
import LeftContainer from "./leftContainer";
import formatChatTimestamp from "@/utils/formatChatTimestamp";

export default async function LeftPanel() {
  const token = (await cookies()).get("auth_token");

  return (
    // <div className=" min-w-[250px] max-w-[250px] p-1">
    //   <div className="flex justify-between p-3">
    //     <div className="text-[14px] font-bold flex items-center">
    //       My Learning Spaces
    //     </div>
    //     <CreateModal userId={JSON.parse(token?.value ?? "").id} />
    //   </div>
    //   <RoomList token={token} />
    // </div>
    <LeftContainer token={token} />
  );
}
