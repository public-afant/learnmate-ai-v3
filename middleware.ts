// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  requestHeaders.set("x-pathname", pathname);

  const tokenString = request.cookies.get("auth_token")?.value;

  // 비로그인 상태일 때, 로그인/API 외의 페이지 접근 시 로그인으로 튕겨냄
  if (!tokenString) {
    if (!pathname.startsWith("/login") && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  try {
    const tokenData = JSON.parse(tokenString);
    const role = tokenData.role;

    // 이미 로그인했는데 로그인 페이지로 가려 할 경우 롤에 맞는 대시보드로 이동
    if (pathname.startsWith("/login")) {
      if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
      if (role === "faculty") return NextResponse.redirect(new URL("/faculty", request.url));
      return NextResponse.redirect(new URL("/", request.url));
    }

    // 관리자(admin) 권한 체킹
    if (role === "admin") {
      // 관리자는 /admin 은 허용, 그 외의 다른 대시보드(/, /faculty) 접근은 /admin으로 리다이렉트
      // 단, API 경로나 특정 허용된 유틸 경로 등은 제외
      if (pathname === "/" || pathname.startsWith("/faculty")) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    // 교수자(faculty) 권한 체킹
    if (role === "faculty") {
      if (pathname === "/" || pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/faculty", request.url));
      }
    }

    // 학생(student) 권한 체킹
    if (role === "student" || role === "user" || !role) {
      if (pathname.startsWith("/admin") || pathname.startsWith("/faculty")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

  } catch (error) {
    // 토큰 파싱 에러 시 로그인 페이지로
    if (!pathname.startsWith("/login") && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
