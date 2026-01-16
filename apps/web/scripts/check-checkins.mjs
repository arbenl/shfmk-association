import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error('Could not read .env.local at', envPath);
    process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        env[key] = value;
    }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
const CONFERENCE_SLUG = env.CONFERENCE_SLUG || 'annual-conference';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkCheckIns() {
    try {
        console.log('Fetching conference information...');

        // First get the conference ID
        const { data: conference, error: confError } = await supabase
            .from('conferences')
            .select('id, name')
            .eq('slug', CONFERENCE_SLUG)
            .single();

        if (confError) {
            console.error('Error fetching conference:', confError);
            process.exit(1);
        }

        console.log(`Found conference: ${conference.name} (ID: ${conference.id})`);

        // Fetch all registrations with check-in data
        console.log('Fetching registrations with check-in data...');
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('id, full_name, email, checked_in_at, created_at')
            .eq('conference_id', conference.id)
            .not('checked_in_at', 'is', null)
            .order('checked_in_at', { ascending: false });

        if (regError) {
            console.error('Error fetching registrations:', regError);
            process.exit(1);
        }

        console.log(`\n📊 Check-in Analysis:`);
        console.log(`Total registrations with check-ins: ${registrations.length}`);

        if (registrations.length > 0) {
            console.log('\n✅ Users who have been checked in:');
            registrations.forEach((user, index) => {
                console.log(`${index + 1}. "${user.full_name}" <${user.email}>`);
                console.log(`   Checked in: ${user.checked_in_at}`);
                console.log(`   Registered: ${user.created_at}`);
                console.log('');
            });
        } else {
            console.log('❌ No check-ins found in database');
        }

        // Also check total registrations
        const { data: allRegs, error: allError } = await supabase
            .from('registrations')
            .select('id, checked_in_at')
            .eq('conference_id', conference.id);

        if (allError) {
            console.error('Error fetching all registrations:', allError);
        } else {
            const checkedIn = allRegs.filter(reg => reg.checked_in_at !== null);
            console.log(`\n📈 Overall Statistics:`);
            console.log(`Total registrations: ${allRegs.length}`);
            console.log(`Checked in: ${checkedIn.length}`);
            console.log(`Not checked in: ${allRegs.length - checkedIn.length}`);
        }

    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
}

checkCheckIns();