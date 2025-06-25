import Image from "next/image";

export default function Login() {
  return (
    <div className="h-[calc(100dvh-60px)] bg-[url('/login_bg.png')] bg-cover">
      <div className="h-full flex justify-center items-center">
        <div className="bg-white w-[920px] h-[660px] min-w-[920px] min-h-[660px] rounded-3xl flex">
          <div className="basis-1/2 flex justify-center items-center flex-col">
            <div className="text-[#9383E9] font-semibold">
              나만의 자기주도 학습
            </div>
            <div className="text-3xl font-bold text-gray-600">LearnMate AI</div>
            <div className="p-7">
              <input
                className="w-[22rem] p-2.5 border-2 border-gray-100 rounded-lg"
                type="text"
                placeholder="유저코드를 입력하세요"
              />
            </div>
            <div className="w-[22rem] h-12 bg-[#E9E6FB]/50 rounded-[10px] flex justify-center items-center cursor-pointer">
              <span className="text-[#7D6BE5] font-semibold">로그인</span>
            </div>

            <div className="w-[22rem] h-12 mt-3 rounded-[10px] flex justify-center items-center cursor-pointer border-2 border-gray-100">
              <Image
                src={"/google_logo.png"}
                alt="Google"
                width={20}
                height={20}
                className="mr-1.5"
              />
              <span className="text-gray-600 font-semibold">
                Google로 로그인하기
              </span>
            </div>
          </div>
          <div className="basis-1/2 flex justify-center items-center">
            <Image
              src={"/login_right_img.png"}
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
