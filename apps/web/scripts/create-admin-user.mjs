import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read .env.local manually to avoid dotenv dependency if not present
// Path relative to apps/web/scripts/create-admin-user.mjs is ../.env.local
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

const ADMIN_EMAIL = 'admin.test+shfmk@gmail.com';
const ADMIN_PASSWORD = 'AdminTest_2025!';

async function main() {
    console.log(`Setting up admin user: ${ADMIN_EMAIL}`);

    // 1. Ensure admin_users table has the email
    const { error: insertError } = await supabase
        .from('admin_users')
        .upsert({ email: ADMIN_EMAIL }, { onConflict: 'email' });

    if (insertError) {
        console.error('Error inserting into admin_users:', insertError);
    } else {
        console.log('✅ Added to admin_users allowlist');
    }

    // 2. Create or Update Auth User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        process.exit(1);
    }

    const existingUser = users.find(u => u.email === ADMIN_EMAIL);

    if (existingUser) {
        console.log('User exists, updating password...');
        const { data: user, error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: ADMIN_PASSWORD, email_confirm: true }
        );
        if (updateError) {
            console.error('Error updating user:', updateError);
            process.exit(1);
        }
        console.log(`OK admin user ready: ${user.user.email} ${user.user.id}`);
    } else {
        console.log('Creating new user...');
        const { data: user, error: createError } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true
        });
        if (createError) {
            console.error('Error creating user:', createError);
            process.exit(1);
        }
        console.log(`OK admin user ready: ${user.user.email} ${user.user.id}`);
    }
}

main();
