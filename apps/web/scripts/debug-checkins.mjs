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

async function debugCheckIns() {
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

        // Fetch first 5 registrations to debug
        console.log('Fetching first 5 registrations for debugging...');
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('conference_id', conference.id)
            .order('created_at', { ascending: false })
            .limit(5);

        if (regError) {
            console.error('Error fetching registrations:', regError);
            process.exit(1);
        }

        console.log('First 5 registrations:');
        registrations.forEach((reg, index) => {
            console.log(`${index + 1}. ${reg.full_name}: checked_in_at = ${reg.checked_in_at} (type: ${typeof reg.checked_in_at})`);
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
}

debugCheckIns();