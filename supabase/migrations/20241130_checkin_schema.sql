-- Add check-in fields to registrations table
alter table registrations 
add column if not exists checked_in boolean default false,
add column if not exists checked_in_at timestamp with time zone;

-- Create type for bulk update payload
create type checkin_payload as (
  "registrationId" uuid,
  "scannedAt" timestamp with time zone
);

-- Create or replace the bulk update RPC
create or replace function bulk_update_checkins(payload jsonb)
returns int
language plpgsql
security definer
as $$
declare
  item jsonb;
  updated_count int := 0;
begin
  for item in select * from jsonb_array_elements(payload)
  loop
    update registrations
    set 
      checked_in = true,
      checked_in_at = coalesce((item->>'scannedAt')::timestamptz, now())
    where id = (item->>'registrationId')::uuid
    and checked_in = false; -- Only update if not already checked in? Or update timestamp?
    -- Let's allow updating timestamp if it wasn't set, but we want to count *new* check-ins.
    -- Actually, if we want to handle "Yellow" state on client, we need to know if it was ALREADY checked in.
    -- The API just updates. The client handles the "Yellow" state by checking its local state or the API response.
    -- But for offline sync, we just want to ensure the DB reflects the check-in.
    
    if found then
      updated_count := updated_count + 1;
    end if;
  end loop;
  
  return updated_count;
end;
$$;
