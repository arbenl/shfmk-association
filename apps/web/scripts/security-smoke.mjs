import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } = process.env;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
    console.error("Missing Supabase env vars");
    process.exit(1);
  }

  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

  const anonSelect = await anon.from("registrations").select("*").limit(1);
  if (!anonSelect.error) {
    console.error("FAIL: anon select on registrations was allowed");
    process.exitCode = 1;
  } else {
    console.log("Anon select blocked as expected:", anonSelect.error.code);
  }

  const anonOutbox = await anon.from("email_outbox").select("*").limit(1);
  if (!anonOutbox.error) {
    console.error("FAIL: anon select on email_outbox was allowed");
    process.exitCode = 1;
  } else {
    console.log("Anon outbox blocked as expected:", anonOutbox.error.code);
  }

  const serviceHealth = await service.from("conferences").select("id").limit(1);
  if (serviceHealth.error) {
    console.error("FAIL: service role cannot read conferences", serviceHealth.error);
    process.exitCode = 1;
  } else {
    console.log("Service read conferences ok");
  }
}

main();
