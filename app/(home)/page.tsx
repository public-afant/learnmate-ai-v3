import Layout from "@/app/(home)/mainLayout";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const token = (await cookies()).get("auth_token");

  if (!token) {
    redirect("/login");
  }

  let isViewer = false;
  try {
    const parsed = JSON.parse(token.value);
    if (parsed.isViewer === true) {
      isViewer = true;
    }
  } catch (e) {
    console.error("Token parse error", e);
  }

  return <Layout isViewer={isViewer} />;
}
