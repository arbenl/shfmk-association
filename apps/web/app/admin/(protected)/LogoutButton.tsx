"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore network errors; still redirect
    } finally {
      router.replace("/admin/login?signedOut=1");
      router.refresh();
    }
  };

  return (
    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Dalja
    </Button>
  );
}
