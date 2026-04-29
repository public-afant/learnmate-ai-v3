import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import AdminTabs from "./adminTabs";

export default async function AdminTestPage() {
  const cookieStore = await cookies();
  const tokenString = cookieStore.get("auth_token")?.value;

  if (!tokenString) {
    redirect("/");
  }

  try {
    const tokenData = JSON.parse(tokenString);
    if (tokenData.role !== "admin") {
      redirect("/");
    }
  } catch (error) {
    redirect("/");
  }

  // Supabase 서버 클라이언트 초기화
  const supabase = await createClient();

  // 사용자 목록 조회
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load users:", error);
  }

  // 사용자 역할별 분류
  const admins = users?.filter((user) => user.role === "admin") || [];
  const faculties = users?.filter((user) => user.role === "faculty") || [];
  const students = users?.filter((user) => user.role !== "admin" && user.role !== "faculty") || [];

  return (
    <div className="h-[calc(100vh-100px)] bg-gray-50 text-gray-800 overflow-hidden">
      <div className="h-full">
        


        {/* Tab Menu UI Component */}
        <AdminTabs admins={admins} faculties={faculties} students={students} />
        
      </div>
    </div>
  );
}
