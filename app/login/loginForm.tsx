"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "./actions";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function LoginForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    const formData = new FormData();
    formData.set("usercode", code);

    const res = await login(formData);
    if (res?.success) {
      if (res?.role === "faculty") {
        router.push("/faculty");
      } else if (res?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } else {
      setError("Please check again and try.");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="p-7">
        <input
          className="w-[22rem] p-2.5 border-2 border-gray-100 rounded-lg"
          type="text"
          placeholder="Enter the verification code"
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLogin(); // 인증 로직 실행
            }
          }}
        />
      </div>
      <button
        onClick={handleLogin}
        className="w-[22rem] h-12 bg-[#E9E6FB]/50 rounded-[10px] flex justify-center items-center cursor-pointer"
      >
        <span className="text-[#7D6BE5] font-semibold">Login</span>
      </button>
      <GoogleLoginButton onError={() => setError("Please check again and try.")} />
      <div className="h-6 mt-3 flex items-start justify-center">
        {error && (
          <span className="text-red-500 text-sm font-medium">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
