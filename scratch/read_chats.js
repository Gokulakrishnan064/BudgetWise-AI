import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read env variables from project/.env
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts[1].trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await supabase.from('chat_history').select('*').order('created_at', { ascending: true });
console.log("DATABASE CHATS:", JSON.stringify(data, null, 2));
if (error) console.error("ERROR:", error);
