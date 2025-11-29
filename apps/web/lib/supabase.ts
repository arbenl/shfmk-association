import { createClient } from "@supabase/supabase-js";
import { CONFERENCE_SLUG, SUPABASE_SERVICE_KEY, SUPABASE_URL } from "./env";
import { RegistrationCategory } from "@shfmk/shared";

export interface Conference {
  id: string;
  name: string;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  registration_open: string | null;
  registration_close: string | null;
  max_participants: number | null;
  currency: string;
  member_fee: number;
  non_member_fee: number;
  student_fee: number;
}

export interface RegistrationRow {
  id: string;
  conference_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  category: RegistrationCategory;
  fee_amount: number;
  currency: string;
  payment_status: string;
  checked_in_at: string | null;
  qr_token: string | null;
  created_at: string;
}

const supabaseClient =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
    : null;

function requireClient() {
  if (!supabaseClient) {
    throw new Error("Supabase client not configured. Check SUPABASE_URL and SUPABASE_SERVICE_KEY.");
  }
  return supabaseClient;
}

export async function getConferenceBySlug(slug: string = CONFERENCE_SLUG): Promise<Conference | null> {
  const client = requireClient();
  const { data, error } = await client
    .from("conferences")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load conference: ${error.message}`);
  }

  return data as Conference | null;
}

export async function getConferenceById(id: string): Promise<Conference | null> {
  const client = requireClient();
  const { data, error } = await client.from("conferences").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load conference: ${error.message}`);
  }
  return data as Conference | null;
}

export async function countRegistrations(conferenceId: string): Promise<number> {
  const client = requireClient();
  const { count, error } = await client
    .from("registrations")
    .select("*", { head: true, count: "exact" })
    .eq("conference_id", conferenceId);

  if (error) {
    throw new Error(`Failed to count registrations: ${error.message}`);
  }

  return count ?? 0;
}

export async function createRegistration(params: {
  conferenceId: string;
  fullName: string;
  email: string;
  phone?: string;
  institution?: string;
  category: RegistrationCategory;
  feeAmount: number;
  currency: string;
}): Promise<RegistrationRow> {
  const client = requireClient();
  const { data, error } = await client
    .from("registrations")
    .insert({
      conference_id: params.conferenceId,
      full_name: params.fullName,
      email: params.email,
      phone: params.phone ?? null,
      institution: params.institution ?? null,
      category: params.category,
      fee_amount: params.feeAmount,
      currency: params.currency
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Failed to create registration: ${error?.message ?? "unknown error"}`);
  }

  return data as RegistrationRow;
}

export async function saveQrToken(registrationId: string, token: string) {
  const client = requireClient();
  const { error } = await client
    .from("registrations")
    .update({ qr_token: token })
    .eq("id", registrationId);

  if (error) {
    throw new Error(`Failed to save QR token: ${error.message}`);
  }
}

export async function listRegistrations(params: {
  conferenceId: string;
  search?: string;
  limit?: number;
}): Promise<RegistrationRow[]> {
  const client = requireClient();
  let query = client
    .from("registrations")
    .select("*")
    .eq("conference_id", params.conferenceId)
    .order("created_at", { ascending: false });

  if (params.search) {
    const term = params.search;
    query = query.or(
      `full_name.ilike.%${term}%,email.ilike.%${term}%`
    );
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list registrations: ${error.message}`);
  }
  return (data as RegistrationRow[]) ?? [];
}

export async function getRegistrationById(id: string): Promise<RegistrationRow | null> {
  const client = requireClient();
  const { data, error } = await client.from("registrations").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load registration: ${error.message}`);
  }
  return data as RegistrationRow | null;
}
