import Link from "next/link";
import Notice from "./notice";
import UserInfo from "./userInfo";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Header() {
  const path = (await headers()).get("x-pathname") || ""; // Next.js 15에서 유효
  const isLoginPage = path.startsWith("/login");

  return (
    <div className="h-[60px]">
      <div className="flex min-w-5xl mx-auto justify-between">
        <div className="h-[60px] flex items-center mx-10 cursor-pointer">
          <Link href={"/"}>
            <span className="text-2xl font-bold text-[#6B50FF]">
              LearnMateAI
            </span>
            <span className="ml-1.5 mt-2  text-[#6B50FF] text-sm font-semibold">
              v3
            </span>
          </Link>
          {!isLoginPage && <Notice />}
        </div>

        {!isLoginPage && <UserInfo />}
      </div>
      <div className="w-full h-[1px] bg-gray-100" />
    </div>
  );
}
