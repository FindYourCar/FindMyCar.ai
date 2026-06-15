import { createClient } from '@supabase/supabase-js'

// Fallback to mock values when env vars are missing (UI preview only).
// Replace with real values in .env.local for full functionality.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)