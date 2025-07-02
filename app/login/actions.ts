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

  const tokenData = {
    id: data.id,
    name: data.name,
  };

  // ✅ 쿠키 저장
  (await cookie).set("auth_token", JSON.stringify(tokenData), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24, // 1일
  });

  return { success: true };
}
