"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
    });

    router.refresh();

    // router.push("/login");
    window.location.href = "/login";
  };
  return (
    <div
      className="font-semibold text-sm px-2 py-1 cursor-pointer"
      onClick={handleLogout}
    >
      Logout
    </div>
  );
}
