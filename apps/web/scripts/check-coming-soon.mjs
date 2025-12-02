#!/usr/bin/env node

/**
 * Smoke-checks the Coming Soon mode.
 * Requires a local server running on http://localhost:3000
 * and env SUPABASE_URL, SUPABASE_SERVICE_KEY, CONFERENCE_SLUG.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const CONFERENCE_SLUG = process.env.CONFERENCE_SLUG || "annual-conference";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchText(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  const text = await res.text();
  return text;
}

async function setPublished(value) {
  const { error } = await service
    .from("conferences")
    .update({ is_published: value })
    .eq("slug", CONFERENCE_SLUG);
  if (error) throw new Error(`Failed to set is_published=${value}: ${error.message}`);
}

async function getCurrent() {
  const { data, error } = await service
    .from("conferences")
    .select("id, is_published")
    .eq("slug", CONFERENCE_SLUG)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function expectContains(path, text, shouldContain = true) {
  const body = await fetchText(path);
  const has = body.includes(text);
  if (has !== shouldContain) {
    throw new Error(`Expectation failed for ${path}: "${text}" ${shouldContain ? "not found" : "should be absent"}.`);
  }
}

async function main() {
  const current = await getCurrent();
  const original = current?.is_published ?? false;

  try {
    await setPublished(false);
    await expectContains("/", "Së shpejti", true);
    await expectContains("/conference/register", "Regjistrimi hapet së shpejti", true);

    await setPublished(true);
    await expectContains("/", "Konferenca", true);
    await expectContains("/conference/register", "Regjistrohu në Konferencë", true);
  } finally {
    await setPublished(original);
  }

  console.log("Coming Soon check passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
