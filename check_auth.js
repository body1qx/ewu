// Quick script to check Supabase auth status
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://scwiswhmlyhzifebjmek.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjd2lzd2htbHloemlmZWJqbWVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODc4NzUsImV4cCI6MjA3OTc2Mzg3NX0.glsaYwm-JGX-W0DD0EYVURnp5Yhb7pRh7u2-NWZqcuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuth() {
  console.log('Checking Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  // Try to get current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error:', sessionError.message);
  } else {
    console.log('Current session:', session ? 'Active' : 'None');
  }
  
  // Try to query profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status')
    .limit(5);
  
  if (profilesError) {
    console.error('Profiles query error:', profilesError.message);
  } else {
    console.log('Profiles found:', profiles?.length || 0);
    if (profiles && profiles.length > 0) {
      console.log('Users:', profiles);
    }
  }
}

checkAuth().catch(console.error);
