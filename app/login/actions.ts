"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function login(formData: FormData) {
  const usercode = formData.get("usercode") as string;
  const supabase = await createClient();
  const cookie = cookies();
  // type-casting here for convenience
  // in practice, you should validate your inputs

  const { data } = await supabase
    .from("users")
    .select()
    .eq("code", usercode)
    .single();
  if (!data) return null;

  // 계정 활성 상태 점검
  if (data.state === false || data.state === "inactive") {
    return { error: "Your account has been suspended or deactivated by an administrator. Please contact support." };
  }

  const tokenData = {
    id: data.id,
    name: data.name,
    role: data.role,
    // 이메일이 있는 계정인데 코드로 로그인한 경우 뷰어 모드로 설정
    isViewer: data.email ? true : false,
  };

  // ✅ 쿠키 저장
  (await cookie).set("auth_token", JSON.stringify(tokenData), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 1일
  });

  return { success: true, role: data.role };
}

export async function googleLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();
  const cookie = cookies();

  const { data } = await supabase
    .from("users")
    .select()
    .eq("email", email)
    .single();

  if (!data) return { error: "해당 이메일로 등록된 계정이 없습니다." };

  // 계정 활성 상태 점검
  if (data.state === false || data.state === "inactive") {
    return { error: "Your account has been suspended or deactivated by an administrator. Please contact support." };
  }

  const tokenData = {
    id: data.id,
    name: data.name,
    role: data.role,
    isGoogleLogin: true,
  };

  // ✅ 쿠키 저장
  (await cookie).set("auth_token", JSON.stringify(tokenData), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 1일
  });

  return { success: true, role: data.role };
}
