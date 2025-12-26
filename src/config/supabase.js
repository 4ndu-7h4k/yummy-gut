import { createClient } from '@supabase/supabase-js'

// Replace these with your Supabase project credentials
// Get them from: https://app.supabase.com/project/_/settings/api
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create a mock client if credentials are missing to prevent errors
let supabaseClient

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  // Create a mock client that will fail gracefully
  supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key')
} else {
  // Configure client with auth options
  // Note: Session duration is configured in Supabase Dashboard > Authentication > Settings
  // Set JWT expiry to 30 days (2592000 seconds) in the dashboard
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  })
}

export const supabase = supabaseClient

