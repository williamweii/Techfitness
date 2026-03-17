import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lyxbqqftcdzbkehumaau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5eGJxcWZ0Y2R6YmtlaHVtYWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjU1MjcsImV4cCI6MjA4MzgwMTUyN30.K1mdm0MELg8rwiqhaFNZRGYevmANKEzmEtWomPukbAM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
