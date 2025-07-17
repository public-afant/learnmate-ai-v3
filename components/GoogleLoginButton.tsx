"use client";

import { useState } from "react";
import Image from "next/image";

interface GoogleLoginButtonProps {
  onSuccess?: (email: string) => void;
  onError?: () => void;
}

const GoogleLoginButton = ({
  // onSuccess,
  onError,
}: GoogleLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);

    // 구글 OAuth URL 생성
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google&` +
      `response_type=code&` +
      `scope=email profile&` +
      `access_type=offline&` +
      `prompt=select_account`;

    // 팝업 창 열기
    const popup = window.open(
      googleAuthUrl,
      "google-login",
      "width=500,height=600,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      console.error("팝업이 차단되었습니다.");
      setIsLoading(false);
      onError?.();
      return;
    }

    // 팝업 상태 체크
    const checkPopup = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkPopup);
          setIsLoading(false);
          // 페이지 새로고침하여 로그인 상태 확인
          window.location.reload();
        }
      } catch (e) {
        // 팝업이 다른 도메인으로 이동했을 때 발생하는 에러 무시
      }
    }, 1000);

    // 5분 후 자동으로 팝업 닫기
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
        clearInterval(checkPopup);
        setIsLoading(false);
        onError?.();
      }
    }, 300000); // 5분
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-[22rem] h-12 mt-3 rounded-[10px] flex justify-center items-center cursor-pointer border-2 border-gray-100 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Image
        src="/google_logo.png"
        alt="Google"
        width={20}
        height={20}
        className="mr-1.5"
      />
      <span className="text-gray-600 font-semibold">
        {isLoading ? "로그인 중..." : "Sign in with Google"}
      </span>
    </button>
  );
};

export default GoogleLoginButton;
