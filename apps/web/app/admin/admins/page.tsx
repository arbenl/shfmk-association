import { createServiceClient } from "@/lib/supabase/server";
import AdminManager from "./AdminManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminsPage() {
  const service = createServiceClient();
  const { data, error } = await service
    .from("admin_users")
    .select("email, created_at")
    .order("created_at", { ascending: false });

  const admins = (data ?? []).map((row) => ({
    email: row.email as string,
    created_at: row.created_at as string,
  }));

  return <AdminManager initialAdmins={admins} loadError={error?.message} />;
}
