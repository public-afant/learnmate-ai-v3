"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "./actions";

export default function LoginForm() {
  const [code, setCode] = useState("");

  const router = useRouter();

  const handleLogin = async () => {
    const formData = new FormData();
    formData.set("usercode", code);

    const res = await login(formData);
    if (res?.success) {
      router.push("/");
    } else {
      alert("인증 실패!");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="p-7">
        <input
          className="w-[22rem] p-2.5 border-2 border-gray-100 rounded-lg"
          type="text"
          placeholder="유저코드를 입력하세요"
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
        <span className="text-[#7D6BE5] font-semibold">로그인</span>
      </button>
    </div>
  );
}
