import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttlzstgyfgfqxejlapqc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0bHpzdGd5ZmdmcXhlamxhcHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NjE3ODksImV4cCI6MjA4NDQzNzc4OX0.ViPPxzmRqquaJapb-HhUuqaKv9URLx9ocE3IkMuwO8I'

export const supabase = createClient(supabaseUrl, supabaseKey)