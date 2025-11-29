import { createClient } from "@supabase/supabase-js";
import { CONFERENCE_SLUG, SUPABASE_SERVICE_KEY, SUPABASE_URL } from "./env";
import { RegistrationCategory } from "@shfmk/shared";

// --- Client Setup ---
const supabaseClient =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
    : null;

function requireClient() {
  if (!supabaseClient) {
    // This will be caught by the API route's try/catch block
    throw new Error("Supabase client not configured. Check SUPABASE_URL and SUPABASE_SERVICE_KEY.");
  }
  return supabaseClient;
}

// --- Interfaces ---
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
  category: RegistrationCategory;
  qr_token: string;
  fee_amount: number;
  currency: string;
  // other fields...
}

// --- Database Functions ---

export async function getRegistrationByEmail(email: string, conferenceId: string): Promise<RegistrationRow | null> {
  const client = requireClient();
  const normalizedEmail = email.toLowerCase().trim();

  const { data, error } = await client
    .from("registrations")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("conference_id", conferenceId)
    .maybeSingle();

  if (error) {
    console.error("DB Error in getRegistrationByEmail:", error);
    throw new Error(`Failed to query for existing registration: ${error.message}`);
  }

  return data as RegistrationRow | null;
}

/**
 * Creates a new registration record in a single atomic operation.
 * Now accepts the pre-generated registrationId and qrToken.
 */
export async function createRegistration(params: {
  id: string; // The pre-generated UUID for the registration
  conferenceId: string;
  fullName: string;
  email: string;
  phone?: string;
  institution?: string;
  category: RegistrationCategory;
  feeAmount: number;
  currency: string;
  qrToken: string; // The pre-generated JWT for the QR code
}): Promise<RegistrationRow> {
  const client = requireClient();
  const { data, error } = await client
    .from("registrations")
    .insert({
      id: params.id,
      conference_id: params.conferenceId,
      full_name: params.fullName,
      email: params.email.toLowerCase().trim(),
      phone: params.phone ?? null,
      institution: params.institution ?? null,
      category: params.category,
      fee_amount: params.feeAmount,
      currency: params.currency,
      qr_token: params.qrToken, // Insert the token directly
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("DB Error in createRegistration:", error);
    throw new Error(`Failed to create registration: ${error?.message ?? "unknown error"}`);
  }

  return data as RegistrationRow;
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
    throw new Error(`Failed to load conference by ID: ${error.message}`);
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

  

  export async function getRegistrationById(id: string): Promise<RegistrationRow | null> {

    const client = requireClient();

    const { data, error } = await client.from("registrations").select("*").eq("id", id).single();

  

    if (error && error.code !== "PGRST116") { // PGRST116 = 0 rows

      console.error("DB Error in getRegistrationById:", error);

      throw new Error(`Failed to load registration by ID: ${error.message}`);

    }

  

    return data as RegistrationRow | null;

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

      const term = `%${params.search.replace(/ /g, "%")}%`;

      query = query.or(`full_name.ilike.${term},email.ilike.${term}`);

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

    

    export async function updateCheckInStatus(checkIns: { registrationId: string, scannedAt: string }[]): Promise<number> {

        const client = requireClient();

        const { data, error } = await client.rpc('bulk_update_checkins', {

            payload: checkIns

        });

    

        if (error) {

            console.error("RPC Error in updateCheckInStatus:", error);

            throw new Error(`Failed to bulk update check-ins: ${error.message}`);

        }

        return data ?? 0;

    }

    

  