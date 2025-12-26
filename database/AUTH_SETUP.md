# Authentication Setup Guide

This guide will help you set up Supabase authentication for the POS system.

## Step 1: Configure Session Duration (1 Month)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Settings**
3. Scroll down to **JWT Settings**
4. Set **JWT expiry** to `2592000` seconds (30 days = 1 month)
5. Click **Save**

## Step 2: Run Migration Script

1. Go to **SQL Editor** in your Supabase Dashboard
2. Open the file `database/migration_add_auth.sql`
3. Copy and paste the entire SQL script
4. Click **Run** (or press Ctrl+Enter)
5. Verify that all policies were created successfully

This migration will:
- Remove the old "allow all" policies
- Add new policies that require authentication for all operations
- Secure all tables (items, orders, order_items, draft_orders, qr_codes)

## Step 3: Create Initial User

You have three options to create the user:

### Option A: Via Supabase Dashboard (Easiest)

1. Go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Fill in:
   - **Email**: `yummygut@yummygut.com` (or your preferred email)
   - **Password**: `4yummygut@2025@bunmaska`
   - **Auto Confirm User**: ✅ Yes
4. Click **Create user**
5. After creation, go to **SQL Editor** and run:
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = jsonb_build_object('username', 'yummygut')
   WHERE email = 'yummygut@yummygut.com';
   ```

### Option B: Via Supabase Management API

Use curl or Postman to make a POST request:

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/auth/v1/admin/users' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yummygut@yummygut.com",
    "password": "4yummygut@2025@bunmaska",
    "email_confirm": true,
    "user_metadata": {
      "username": "yummygut"
    }
  }'
```

Replace:
- `YOUR_PROJECT` with your Supabase project ID
- `YOUR_SERVICE_ROLE_KEY` with your service role key (found in Settings > API)

### Option C: Via Supabase CLI

If you have Supabase CLI installed:

```bash
supabase auth users create yummygut@yummygut.com \
  --password "4yummygut@2025@bunmaska" \
  --email-confirm
```

Then update metadata:
```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object('username', 'yummygut')
WHERE email = 'yummygut@yummygut.com';
```

## Step 4: Test Login

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. You should be redirected to `/login`
4. Login with:
   - **Username/Email**: `yummygut@yummygut.com` (or the email you used)
   - **Password**: `4yummygut@2025@bunmaska`
5. After successful login, you should be redirected to the POS screen

## Important Notes

- **Email vs Username**: Supabase uses email-based authentication. The login form accepts both email and username, but internally it uses email.
- **Session Duration**: The session will last for 1 month (30 days) as configured in Step 1.
- **Password Security**: Make sure to change the default password in production!
- **Service Role Key**: Never expose your service role key in client-side code. Only use it server-side or in secure environments.

## Troubleshooting

### "Invalid login credentials"
- Verify the user was created successfully
- Check that the email matches exactly (case-sensitive)
- Ensure the password is correct

### "Session expired" or "Not authenticated"
- Check that the JWT expiry is set to 2592000 seconds
- Verify RLS policies are correctly applied
- Check browser console for auth errors

### User can't access data after login
- Verify the migration script ran successfully
- Check that RLS policies allow authenticated users
- Ensure the user is properly authenticated (check `auth.users` table)

## Security Best Practices

1. **Change Default Password**: Change the default password after first login
2. **Use Strong Passwords**: Enforce strong password policies
3. **Enable MFA**: Consider enabling multi-factor authentication for production
4. **Monitor Auth Logs**: Regularly check authentication logs in Supabase Dashboard
5. **Rotate Keys**: Regularly rotate your API keys

