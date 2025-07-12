import Image from "next/image";
// import LogoutButton from "./logout";

export default function Notice() {
  return (
    <div className="h-[60px]  min-w-xs flex items-center ml-10">
      <div className="w-3xl h-10 bg-gray-100 rounded-lg flex items-center">
        <Image
          src={"/ic-notice.png"}
          alt="notice"
          width={20}
          height={20}
          className="ml-4"
        />
        <p className="mr-4 font-semibold text-[15px]">Notice</p>
        <p className="text-sm cursor-pointer hover:underline">
          Watch out for Halushination!
        </p>
      </div>
      {/* <LogoutButton /> */}
    </div>
  );
}
