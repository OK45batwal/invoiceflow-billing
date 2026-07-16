// Cloudflare Worker Deployment Trigger
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Detect if running inside Cloudflare Workers
const isCloudflareWorker = typeof globalThis.caches !== 'undefined' && typeof globalThis.WebSocketPair !== 'undefined';

// Only load dotenv locally if not on Cloudflare and supabase url is missing
if (!isCloudflareWorker && process.env.NODE_ENV !== 'production' && !process.env.SUPABASE_URL) {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: SUPABASE_URL and SUPABASE_KEY must be set.');
  if (process.env.NODE_ENV !== 'production' && !process.env.CF_PAGES) {
    process.exit(1);
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

console.log('Supabase client successfully initialized for URL:', supabaseUrl);
