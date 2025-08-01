"use client";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useEffect, useState } from "react";

const supabase = createClient();

export default function ChatTab({ selectedRoom }) {
  const [invite, setInvite] = useState(null);

  async function getInvite() {
    const { data } = await supabase
      .from("invite")
      .select()
      .eq("fk_room_id", selectedRoom.id)
      .single();
    setInvite(data);
  }
  useEffect(() => {
    getInvite();
  }, [selectedRoom]);
  return (
    <>
      {invite === null || !invite ? (
        <div className="flex flex-col items-center mt-10">
          <div>
            <Image src={"/ic-approval.png"} width={400} height={100} alt="ic" />
          </div>
          <div className="font-bold text-[16px]">
            &quot;Waiting for instructor matching to begin&quot;
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center mt-10">
          <div>
            <Image src={"/ic-approval.png"} width={400} height={100} alt="ic" />
          </div>
          <div className="font-bold text-[16px]">
            Waiting for the instructor to accept your request
          </div>
        </div>
      )}
    </>
  );
}
