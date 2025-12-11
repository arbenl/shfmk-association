import { createClient } from "@supabase/supabase-js";
import { CONFERENCE_SLUG, SUPABASE_SERVICE_KEY, SUPABASE_URL } from "./env";
import { RegistrationCategory } from "@shfmk/shared";

// --- Client Setup ---
const supabaseClient =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" })
      }
    })
    : null;

function requireClient() {
  if (!supabaseClient) {
    // This will be caught by the API route's try/catch block
    throw new Error("Supabase client not configured. Check SUPABASE_URL and SUPABASE_SERVICE_KEY.");
  }
  return supabaseClient;
}

export function asTimestamptzOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function buildPayload<T extends Record<string, any>>(updates: Partial<T>, allowedKeys: (keyof T)[]) {
  const payload: Partial<T> = {};
  for (const key of allowedKeys) {
    if (key in updates && updates[key] !== undefined) {
      payload[key] = updates[key];
    }
  }
  return payload;
}

// --- Interfaces ---
export interface SiteSettings {
  id: string;
  org_name: string;
  email: string;
  phone: string | null;
  phone2: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  updated_at: string | null;
  updated_by_email: string | null;
}

export interface Conference {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  venue_address: string | null;
  venue_city: string | null;
  registration_open: boolean | null;
  registration_deadline: string | null;
  is_published: boolean | null;
  agenda_json: any | null;
  max_participants: number | null;
  currency: string;
  member_fee: number;
  non_member_fee: number;
  student_fee: number;
}

// ... existing RegistrationRow interface ...

// --- Database Functions ---

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const client = requireClient();
  const { data, error } = await client
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("DB Error in getSiteSettings:", error);
    // Don't throw, just return null so UI can use defaults
    return null;
  }

  return data as SiteSettings | null;
}

export async function updateSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const client = requireClient();

  // First check if a row exists
  const existing = await getSiteSettings();

  let result;

  if (existing) {
    const { data, error } = await client
      .from("site_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update settings: ${error.message}`);
    result = data;
  } else {
    const { data, error } = await client
      .from("site_settings")
      .insert({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create settings: ${error.message}`);
    result = data;
  }

  return result as SiteSettings;
}

export async function updateConference(id: string, updates: Partial<Conference>): Promise<Conference> {
  const client = requireClient();
  const allowedKeys: (keyof Conference)[] = [
    "name",
    "slug",
    "subtitle",
    "start_date",
    "end_date",
    "location",
    "venue_address",
    "venue_city",
    "registration_open",
    "registration_deadline",
    "is_published",
    "agenda_json",
    "max_participants",
    "currency",
    "member_fee",
    "non_member_fee",
    "student_fee",
  ];
  const normalized: Partial<Conference> = { ...updates };
  if ("start_date" in updates) {
    normalized.start_date = asTimestamptzOrNull(updates.start_date);
  }
  if ("end_date" in updates) {
    normalized.end_date = asTimestamptzOrNull(updates.end_date);
  }
  if ("registration_deadline" in updates) {
    normalized.registration_deadline = asTimestamptzOrNull(updates.registration_deadline);
  }

  const payload: Partial<Conference> & { updated_at?: string } = buildPayload(normalized, allowedKeys);
  payload.updated_at = new Date().toISOString();

  const { data, error } = await client
    .from("conferences")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update conference: ${error.message}`);
  }

  return data as Conference;
}

// ... existing functions ...

export interface RegistrationRow {
  id: string;
  conference_id: string;
  full_name: string;
  email: string;
  category: RegistrationCategory;
  qr_token: string;
  fee_amount: number;
  currency: string;
  payment_status: string;
  phone?: string | null;
  institution?: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  participation_type: string;
  points: number;
  is_spam?: boolean | null;
  email_status: string;
  email_attempts: number;
  email_last_error: string | null;
  email_sent_at: string | null;
  resend_last_at: string | null;
  resend_count: number;
  created_at: string;
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
  participationType: "pasiv" | "aktiv";
  points: number;
  feeAmount: number;
  currency: string;
  qrToken: string; // The pre-generated JWT for the QR code
  isSpam?: boolean;
}): Promise<RegistrationRow> {
  const client = requireClient();
  const normalizedEmail = params.email.toLowerCase().trim();
  const { data, error } = await client
    .from("registrations")
    .insert({
      id: params.id,
      conference_id: params.conferenceId,
      full_name: params.fullName,
      email: normalizedEmail,
      phone: params.phone ?? null,
      institution: params.institution ?? null,
      category: params.category,
      participation_type: params.participationType,
      points: params.points,
      fee_amount: params.feeAmount,
      currency: params.currency,
      qr_token: params.qrToken, // Insert the token directly
      is_spam: params.isSpam ?? false,
    })
    .select("*")
    .single();

  if (error || !data) {
    // If unique constraint hit due to concurrency, return existing record for idempotency.
    if (error?.message?.includes("duplicate key value")) {
      return (await getRegistrationByEmail(normalizedEmail, params.conferenceId)) as RegistrationRow;
    }
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

  emailStatus?: string;

  limit?: number;

}): Promise<RegistrationRow[]> {

  const client = requireClient();

  let query = client

    .from("registrations")

    .select("*")

    .eq("conference_id", params.conferenceId)

    .order("created_at", { ascending: false });



  if (params.search) {

    const term = `%${params.search}%`;
    query = query.or(`full_name.ilike.${term},email.ilike.${term}`);

  }


  if (params.emailStatus) {
    if (params.emailStatus === "failed") {
      query = query.in("email_status", ["failed", "bounced", "complained"]);
    } else {
      query = query.eq("email_status", params.emailStatus);
    }
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


export interface EmailOutboxRow {
  id: string;
  registration_id: string;
  type: string;
  status: string;
  attempts: number;
  last_error: string | null;
  provider_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function createEmailOutboxEntry(params: {
  registrationId: string;
  type: string;
  status?: string;
}): Promise<EmailOutboxRow> {
  const client = requireClient();
  const { data, error } = await client
    .from("email_outbox")
    .insert({
      registration_id: params.registrationId,
      type: params.type,
      status: params.status ?? "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("DB Error in createEmailOutboxEntry:", error);
    throw new Error(`Failed to create outbox entry: ${error?.message ?? "unknown"}`);
  }
  return data as EmailOutboxRow;
}

export async function updateEmailOutboxStatus(
  id: string,
  updates: Partial<Pick<EmailOutboxRow, "status" | "last_error" | "provider_id" | "attempts">>
): Promise<EmailOutboxRow> {
  const client = requireClient();
  const { data, error } = await client
    .from("email_outbox")
    .update({
      ...updates,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("DB Error in updateEmailOutboxStatus:", error);
    throw new Error(`Failed to update outbox entry: ${error?.message ?? "unknown"}`);
  }
  return data as EmailOutboxRow;
}

export async function getOutboxByProviderId(providerId: string): Promise<EmailOutboxRow | null> {
  const client = requireClient();
  const { data, error } = await client
    .from("email_outbox")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) {
    console.error("DB Error in getOutboxByProviderId:", error);
    return null;
  }
  return (data as EmailOutboxRow) ?? null;
}

export async function updateRegistrationEmailMeta(
  registrationId: string,
  options: {
    status?: string;
    lastError?: string | null;
    markSent?: boolean;
    incrementAttempts?: boolean;
    incrementResend?: boolean;
  }
): Promise<RegistrationRow> {
  const client = requireClient();
  const current = await getRegistrationById(registrationId);
  if (!current) {
    throw new Error("Registration not found");
  }

  const payload: any = {};
  if (options.status) payload.email_status = options.status;
  if (options.lastError !== undefined) payload.email_last_error = options.lastError;
  if (options.markSent) payload.email_sent_at = new Date().toISOString();

  const attempts = options.incrementAttempts
    ? (current.email_attempts ?? 0) + 1
    : current.email_attempts ?? 0;
  payload.email_attempts = attempts;

  if (options.incrementResend) {
    payload.resend_count = (current.resend_count ?? 0) + 1;
    payload.resend_last_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from("registrations")
    .update(payload)
    .eq("id", registrationId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("DB Error in updateRegistrationEmailMeta:", error);
    throw new Error(`Failed to update registration email meta: ${error?.message ?? "unknown"}`);
  }

  return data as RegistrationRow;
}
