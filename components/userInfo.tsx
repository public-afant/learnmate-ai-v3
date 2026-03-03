import { cookies } from "next/headers";
import LogoutButton from "./logout";
import { createClient } from "@/utils/supabase/server";
import UserCodeTag from "./userCodeTag";

export default async function UserInfo() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  let name = "000";
  let role = "";
  let code = "";
  let hasEmail = false;
  let userId = "";

  if (token) {
    try {
      const parsed = JSON.parse(token.value);
      name = parsed.name;
      role = parsed.role;
      userId = parsed.id;

      // Fetch the user's code and email from the database
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("users")
        .select("code, email")
        .eq("id", parsed.id)
        .single();
      
      if (data) {
        code = data.code;
        hasEmail = !!data.email;
      }
    } catch (err) {
      console.error("Error parsing token or fetching user:", err);
    }
  }

  // 학생인 경우(보통 role이 null이거나 "student"임)에만 코드 태그 표시
  const isStudent = !role || role === "student" || role === "Student";

  return (
    <div className="h-[60px] flex items-center mx-10 min-w-[200px] justify-end">
      {isStudent && code && (
        <UserCodeTag initialCode={code} userId={userId} hasEmail={hasEmail} />
      )}
      <span className="text-sm">Welcome,</span>
      <span className="font-semibold pl-1 text-sm">{name}</span>
      <span className="mr-2">!</span>
      <LogoutButton />
    </div>
  );
}
