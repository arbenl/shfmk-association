import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect("/admin/registrations");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoginForm />
    </div>
  );
}
