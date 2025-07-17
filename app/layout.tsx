import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";

// font-family addition
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

export const metadata: Metadata = {
  title: "LearnMateAI V3",
};
export const dynamic = "force-dynamic"; // ✅ 쿠키 상태 반영

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="hide-scrollbar">
      <body className={` ${pretendard.variable}`}>
        <Header />
        {children}

        <Footer />
      </body>
    </html>
  );
}
