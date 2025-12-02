import { createClient } from "@supabase/supabase-js";
import { CONFERENCE_SLUG, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Conference, RegistrationRow, SiteSettings } from "@/lib/supabase";

const publicClient =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" })
      }
    })
    : null;

function requirePublicClient() {
  if (!publicClient) {
    throw new Error("Supabase public client not configured. Check SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return publicClient;
}

export async function getPublicSiteSettings(): Promise<SiteSettings | null> {
  const client = requirePublicClient();
  const { data, error } = await client
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("DB Error in getPublicSiteSettings:", error);
    return null;
  }

  return data as SiteSettings | null;
}

export async function getPublishedConferenceBySlug(slug: string = CONFERENCE_SLUG): Promise<Conference | null> {
  const client = requirePublicClient();
  const { data, error } = await client
    .from("conferences")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("DB Error in getPublishedConferenceBySlug:", error);
    return null;
  }

  return data as Conference | null;
}

export async function getPublicRegistrationById(id: string): Promise<RegistrationRow | null> {
  const client = requirePublicClient();
  const { data, error } = await client
    .from("registrations")
    .select("id, full_name, email, category, participation_type, points, fee_amount, currency, qr_token, checked_in, checked_in_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("DB Error in getPublicRegistrationById:", error);
    return null;
  }

  return data as RegistrationRow | null;
}

export async function getPublicConference(slug: string = CONFERENCE_SLUG): Promise<{
  conference: Conference | null;
  settings: SiteSettings | null;
}> {
  const [conference, settings] = await Promise.all([
    getPublishedConferenceBySlug(slug),
    getPublicSiteSettings()
  ]);

  return { conference, settings };
}
