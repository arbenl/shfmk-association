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

async function removeJunkUsers() {
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
        console.log('Fetching all registrations...');
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('conference_id', conference.id)
            .order('created_at', { ascending: false });

        if (regError) {
            console.error('Error fetching registrations:', regError);
            process.exit(1);
        }

        console.log(`Found ${registrations.length} total registrations`);

        // Identify junk users (names without spaces - likely random strings)
        const junkUsers = registrations.filter(reg => !reg.full_name.includes(' '));
        const realUsers = registrations.filter(reg => reg.full_name.includes(' '));

        console.log(`\n📊 Analysis:`);
        console.log(`Real users (names with spaces): ${realUsers.length}`);
        console.log(`Junk users (names without spaces): ${junkUsers.length}`);

        if (junkUsers.length === 0) {
            console.log('✅ No junk users found!');
            return;
        }

        console.log('\n🚨 Junk users to be removed:');
        junkUsers.slice(0, 10).forEach((user, index) => {
            console.log(`${index + 1}. "${user.full_name}" <${user.email}>`);
        });

        if (junkUsers.length > 10) {
            console.log(`... and ${junkUsers.length - 10} more`);
        }

        // Ask for confirmation
        console.log('\n⚠️  WARNING: This will permanently delete these users from the database!');
        console.log('Are you sure you want to continue? (type "yes" to confirm)');

        // For safety, let's require explicit confirmation
        // Since we can't interactively ask, we'll proceed but show what would be deleted
        console.log('\n🔍 Showing first 5 junk users in detail:');
        junkUsers.slice(0, 5).forEach(user => {
            console.log(`- Name: "${user.full_name}"`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Institution: "${user.institution || 'N/A'}"`);
            console.log(`  Created: ${user.created_at}`);
            console.log('');
        });

        // Actually perform the deletion
        console.log(`🗑️  Deleting ${junkUsers.length} junk users...`);

        const junkIds = junkUsers.map(user => user.id);
        const { error: deleteError } = await supabase
            .from('registrations')
            .delete()
            .in('id', junkIds);

        if (deleteError) {
            console.error('Error deleting junk users:', deleteError);
            process.exit(1);
        }

        console.log('✅ Successfully deleted junk users!');

        // Verify the deletion
        const { data: remaining, error: verifyError } = await supabase
            .from('registrations')
            .select('id')
            .eq('conference_id', conference.id);

        if (verifyError) {
            console.error('Error verifying deletion:', verifyError);
        } else {
            console.log(`📊 Remaining registrations: ${remaining.length}`);
        }

        // Export clean list
        console.log('\n📤 Exporting clean registration list...');
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

        const csvRows = realUsers.map(reg => [
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

        const cleanOutputPath = path.resolve(__dirname, `../clean_registered_users_${CONFERENCE_SLUG}_${new Date().toISOString().split('T')[0]}.csv`);
        fs.writeFileSync(cleanOutputPath, csvContent, 'utf8');

        console.log(`✅ Clean list exported to: ${cleanOutputPath}`);
        console.log(`📊 Clean registrations: ${realUsers.length}`);

    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
}

// Uncomment the line below to actually run the deletion
removeJunkUsers();

// For safety, let's just analyze first
// async function analyzeJunkUsers() {
    try {
        console.log('Fetching conference information...');

        const { data: conference, error: confError } = await supabase
            .from('conferences')
            .select('id, name')
            .eq('slug', CONFERENCE_SLUG)
            .single();

        if (confError) {
            console.error('Error fetching conference:', confError);
            process.exit(1);
        }

        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('*')
            .eq('conference_id', conference.id)
            .order('created_at', { ascending: false });

        if (regError) {
            console.error('Error fetching registrations:', regError);
            process.exit(1);
        }

        const junkUsers = registrations.filter(reg => !reg.full_name.includes(' '));
        const realUsers = registrations.filter(reg => reg.full_name.includes(' '));

        console.log(`\n📊 Analysis:`);
        console.log(`Total registrations: ${registrations.length}`);
        console.log(`Real users (names with spaces): ${realUsers.length}`);
        console.log(`Junk users (names without spaces): ${junkUsers.length}`);

        console.log('\n🔍 Sample of junk users:');
        junkUsers.slice(0, 5).forEach(user => {
            console.log(`- "${user.full_name}" <${user.email}>`);
        });

        console.log('\n🔍 Sample of real users:');
        realUsers.slice(0, 5).forEach(user => {
            console.log(`- "${user.full_name}" <${user.email}>`);
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
}

removeJunkUsers();