// app/logout/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  (await cookies()).delete("auth_token"); // 저장했던 쿠키 키에 맞게 수정
  return NextResponse.json({ success: true });
}
