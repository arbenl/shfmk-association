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

async function downloadRegisteredUsers() {
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

        // Fetch all registrations for this conference
        console.log('Fetching registered users...');
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('conference_id', conference.id)
            .order('created_at', { ascending: false });

        if (regError) {
            console.error('Error fetching registrations:', regError);
            process.exit(1);
        }

        console.log(`Found ${registrations.length} registrations`);

        // Convert to CSV
        const csvHeaders = [
            'ID',
            'Full Name',
            'Email',
            'Phone',
            'Institution',
            'Category',
            'Fee Amount',
            'Currency',
            'Payment Status',
            'Checked In At',
            'QR Token',
            'Created At'
        ];

        const csvRows = registrations.map(reg => [
            reg.id,
            `"${reg.full_name}"`,
            `"${reg.email}"`,
            `"${reg.phone || ''}"`,
            `"${reg.institution || ''}"`,
            `"${reg.category}"`,
            reg.fee_amount,
            reg.currency,
            reg.payment_status,
            reg.checked_in_at || '',
            `"${reg.qr_token}"`,
            reg.created_at
        ]);

        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.join(','))
            .join('\n');

        // Write to file
        const outputPath = path.resolve(__dirname, `../registered_users_${CONFERENCE_SLUG}_${new Date().toISOString().split('T')[0]}.csv`);
        fs.writeFileSync(outputPath, csvContent, 'utf8');

        console.log(`✅ Successfully exported ${registrations.length} registrations to:`);
        console.log(outputPath);

        // Also print summary
        const paymentStatuses = registrations.reduce((acc, reg) => {
            acc[reg.payment_status] = (acc[reg.payment_status] || 0) + 1;
            return acc;
        }, {});

        console.log('\n📊 Summary:');
        console.log(`Total registrations: ${registrations.length}`);
        Object.entries(paymentStatuses).forEach(([status, count]) => {
            console.log(`${status}: ${count}`);
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
}

downloadRegisteredUsers();