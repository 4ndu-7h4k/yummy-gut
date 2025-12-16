# Quick Setup Guide

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/login
3. Click "New Project"
4. Fill in project details (name, database password, region)
5. Wait for project to be created (~2 minutes)

## Step 3: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 4: Set Up Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual values from Step 3.

## Step 5: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Open `database/schema.sql` from this project
4. Copy all the SQL code
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

## Step 6: Verify Setup

1. Check that tables were created:
   - Go to **Table Editor** in Supabase
   - You should see: `items`, `orders`, `order_items`, `draft_orders`

2. Check sample data:
   - Open the `items` table
   - You should see 5 sample items (Bun, Chai, Coffee, Sandwich, Samosa)

## Step 7: Run the Application

```bash
npm run dev
```

Open `http://localhost:5173` in your browser (or the URL shown in terminal).

## Step 8: Test the App

1. **POS Screen**: You should see the 5 sample items
2. **Add to Cart**: Tap ➕ buttons to add items
3. **Place Order**: Tap "Place Order" button
4. **Check Orders**: Navigate to Orders tab to see your order
5. **Check Reports**: Navigate to Reports tab to see sales data

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure `.env` file exists in project root
- Check that variable names start with `VITE_`
- Restart the dev server after creating `.env`

### Database errors
- Make sure you ran the SQL schema script completely
- Check that RLS policies were created (should see them in Authentication → Policies)

### Items not loading
- Check browser console for errors
- Verify Supabase URL and key are correct
- Check Network tab to see if API calls are failing

### Build errors
- Make sure Node.js version matches requirements (20.19.0+ or 22.12.0+)
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

## Next Steps

- Customize items in the Items Management screen
- Add your shop's logo (replace favicon.ico)
- Adjust colors in Tailwind classes if needed
- Set up authentication if you want shop owner login

## Production Deployment

1. Build the app: `npm run build`
2. Deploy the `dist` folder to:
   - Vercel
   - Netlify
   - GitHub Pages
   - Any static hosting service

Make sure to set environment variables in your hosting platform's settings!

