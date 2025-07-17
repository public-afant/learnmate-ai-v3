import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Layout from "./mainLayout";

export default async function Faculty() {
  const token = (await cookies()).get("auth_token");
  if (!token) {
    redirect("/login");
  }
  // 예시: 토큰에서 faculty id 추출 (실제 구조에 맞게 파싱 필요)
  let userId = "";
  try {
    userId = JSON.parse(token.value).id;
  } catch {
    userId = "";
  }
  return <Layout userId={userId} />;
}
