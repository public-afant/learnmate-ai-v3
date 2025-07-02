import { cookies } from "next/headers";
import LogoutButton from "./logout";

export default async function UserInfo() {
  const token = (await cookies()).get("auth_token");

  return (
    <div className="h-[60px] flex items-center mx-10 min-w-[200px] justify-end">
      {/* <div className="w-6 h-6 rounded-2xl bg-gray-200"></div> */}
      <span className="text-sm">Welcome,</span>
      <span className="font-semibold pl-0.5 text-sm">
        {token !== undefined ? JSON.parse(token.value).name : "000"}
      </span>
      !
      <LogoutButton />
    </div>
  );
}
