import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  
  if (!code) {
    return new NextResponse(`
      <html>
        <body>
          <script>
            alert('인증 코드를 받지 못했습니다.');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  try {
    // 구글 OAuth 토큰 교환
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google`,
      }),
    });

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      return new NextResponse(`
        <html>
          <body>
            <script>
              alert('토큰 교환에 실패했습니다.');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 사용자 정보 가져오기
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const googleUser = await userResponse.json();
    
    if (!googleUser.email) {
      return new NextResponse(`
        <html>
          <body>
            <script>
              alert('이메일 정보를 가져올 수 없습니다.');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Supabase에서 사용자 확인
    const supabase = await createClient();
    const { data: user } = await supabase
      .from("users")
      .select()
      .eq("email", googleUser.email)
      .single();

    if (!user) {
      return new NextResponse(`
        <html>
          <body>
            <script>
              alert('해당 이메일로 등록된 계정이 없습니다.');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 쿠키에 사용자 정보 저장
    const tokenData = {
      id: user.id,
      name: user.name,
      isGoogleLogin: true,
    };

    const cookie = cookies();
    (await cookie).set("auth_token", JSON.stringify(tokenData), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1일
    });

    // 역할에 따른 리다이렉션 URL 결정
    let redirectUrl = "/";
    if (user.role === "admin") {
      redirectUrl = "/admin";
    } else if (user.role === "faculty") {
      redirectUrl = "/faculty";
    }

    // 팝업 닫기 및 부모 창 리다이렉션
    return new NextResponse(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.location.href = '${redirectUrl}';
              window.close();
            } else {
              window.location.href = '${redirectUrl}';
            }
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error("Google OAuth error:", error);
    return new NextResponse(`
      <html>
        <body>
          <script>
            alert('로그인 중 오류가 발생했습니다.');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
} 