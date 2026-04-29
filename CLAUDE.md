# learnmate-ai-v3 CLAUDE.md

Next.js 15 프론트엔드. 전체 아키텍처 및 서비스 구성은 루트 `../CLAUDE.md` 참조.

## 명령어

```bash
npm run dev      # 개발 서버 (port 3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
npm run lint     # ESLint 검사
```

테스트 스위트 없음. `next.config.ts`에서 빌드 시 ESLint·TypeScript 오류 무시하도록 설정됨.

## 기술 스택

- **프레임워크:** Next.js 15 (App Router) + React 19 + TypeScript 5
- **스타일링:** Tailwind CSS 4 + `@tailwindcss/typography`
- **DB·인증:** Supabase (PostgreSQL + SSR 세션)
- **상태 관리:** Zustand 5 (`store/`)
- **HTTP:** Axios (백엔드 AI 서버 호출)
- **마크다운:** react-markdown + remark-gfm + highlight.js
- **에디터:** Tiptap 2 + Toast UI Editor

## 라우팅

| 경로 | 역할 | 필요 역할 |
|------|------|-----------|
| `/` | 학생 대시보드 (3패널) | `student` |
| `/faculty` | 교수자 대시보드 (3패널) | `faculty` |
| `/admin` | 관리자 유저 관리 | `admin` |
| `/login` | 코드 입력 + Google OAuth | - |
| `/api/auth/google` | Google OAuth 콜백 | - |
| `/api/logout` | 로그아웃 (쿠키 삭제) | - |

## 인증 & 역할 기반 라우팅

`middleware.ts`가 모든 라우트를 보호. `auth_token` HTTP-only 쿠키(JWT) 사용:

```ts
{ id, name, role: "student" | "faculty" | "admin", isGoogleLogin?, isViewer? }
```

- 미인증 → `/login` 리다이렉트
- 역할 불일치 → 각 역할의 기본 경로로 리다이렉트
- `isViewer: true` → 읽기 전용 (액션 버튼 숨김, 입력 비활성화)

Google OAuth 콜백: `app/api/auth/google/route.ts` — 인가 코드 교환 → Supabase 유저 조회 → JWT 발급 → 팝업 닫기

## 폴더 구조

```
app/
├── (home)/              # 학생 대시보드
│   ├── (left)/          # 왼쪽 패널: 방 목록, 생성 모달
│   ├── (right)/         # 오른쪽 패널 탭: plan, note, 교수자 채팅
│   └── page.tsx
├── faculty/             # 교수자 대시보드
├── admin/               # 관리자
├── login/               # 로그인 (actions.ts: 서버 액션)
└── api/                 # Route Handlers

components/              # 공용 컴포넌트
store/                   # Zustand 스토어
utils/
├── supabase/
│   ├── client.ts        # 브라우저용 (Client Component)
│   └── server.ts        # 서버용 (Server Component / Route Handler)
├── filterJson.ts        # AI 응답에서 JSON 추출
├── convertMarkdown.ts
└── formatChatTimestamp.ts
middleware.ts            # JWT 검증 + 역할 라우팅
```

## 3패널 레이아웃

`app/(home)/mainLayout.tsx`(학생), `app/faculty/mainLayout.tsx`(교수) 동일 구조:

```
[ 왼쪽: 룸 목록 ] [ 가운데: AI 채팅 ] [ 오른쪽: 노트 / 학습계획 / 교수자 채팅 ]
```

## Zustand 스토어 (`store/`)

| 스토어 | 역할 |
|--------|------|
| `chatStore` | 선택된 방의 채팅 메시지 |
| `roomStore` | 현재 선택된 방 |
| `challengeStore` | 챌린지/퀴즈 메시지 |
| `replyStore` | 답장 대상 메시지 참조 |
| `rightPanelStore` | 오른쪽 패널 열림/닫힘 |

## Supabase 테이블

`users`, `rooms`, `chats`, `challenge_chats`, `invite`, `note`

## 학습 플랜 & JSON 추출

AI 응답에 마크다운 코드 펜스 안에 JSON이 포함될 수 있음:
- `utils/filterJson.ts` — JSON 추출
- `components/planModal.tsx` — 파싱된 플랜 렌더링

## 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET          # 서버 전용
NEXT_PUBLIC_NODE_BASE_URL     # 백엔드 AI 서버 URL (learnmate-ai-server)
NEXT_PUBLIC_SITE_URL
```
