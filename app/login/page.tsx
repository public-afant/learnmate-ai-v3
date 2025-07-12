import { login } from "@/app/login/actions";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import LoginForm from "./loginForm";
import Image from "next/image";
import GoogleLoginButton from "@/components/GoogleLoginButton";

async function getUser() {
  const cookie = cookies();
  const authToken = (await cookie).get("auth_token");
  
  if (authToken) {
    try {
      const user = JSON.parse(authToken.value);
      return user;
    } catch (error) {
      console.error("Failed to parse auth token:", error);
      return null;
    }
  }
  return null;
}

export default async function LoginPage() {
  const user = await getUser();
  
  if (user) {
    redirect("/");
  }

  return (
    <div className="h-[calc(100dvh-60px)] bg-[url('/login_bg.png')] bg-cover">
      <div className="h-full flex justify-center items-center">
        <div className="bg-white w-[920px] h-[660px] min-w-[920px] min-h-[660px] rounded-3xl flex">
          <div className="basis-1/2 flex justify-center items-center flex-col">
            <div className="text-[#9383E9] font-semibold">
              나만의 자기주도 학습
            </div>
            <div className="text-3xl font-bold text-gray-600">LearnMate AI</div>

            <LoginForm />

            <GoogleLoginButton />
          </div>
          <div className="basis-1/2 flex justify-center items-center">
            <Image
              src="/login_right_img.png"
              alt="Login"
              className="rounded-2xl"
              width={390}
              height={500}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
