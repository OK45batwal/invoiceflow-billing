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

// Custom fetch to wrap all Supabase requests in the circuit breaker
const customFetch = (url, options = {}) => {
  const method = options.method || 'GET';
  const urlStr = url.toString();
  const isRestQuery = urlStr.includes('/rest/v1/');
  const isRead = method === 'GET' && isRestQuery;
  
  // Safe empty data fallback for read queries to keep UI functional
  const fallback = isRead 
    ? () => new Response('[]', { 
        status: 200, 
        headers: { 'content-type': 'application/json' } 
      })
    : undefined;

  return dbBreaker.execute(() => globalThis.fetch(url, options), fallback);
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  global: {
    fetch: customFetch
  }
});

console.log('Supabase client successfully initialized for URL:', supabaseUrl);

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.cooldownPeriod = options.cooldownPeriod || 10000; // 10s cooldown
    this.timeout = options.timeout || 5000; // 5s timeout
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastStateChange = Date.now();
  }

  async execute(fn, fallback) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastStateChange > this.cooldownPeriod) {
        this.state = 'HALF_OPEN';
        this.lastStateChange = Date.now();
        console.warn('Circuit Breaker is now HALF_OPEN - probing database...');
      } else {
        console.error('Circuit Breaker is OPEN. Fast-failing database query.');
        if (fallback !== undefined) {
          return typeof fallback === 'function' ? fallback() : fallback;
        }
        throw new Error('Circuit Breaker is OPEN: Database is currently unreachable.');
      }
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timed out')), this.timeout)
    );

    try {
      const result = await Promise.race([fn(), timeoutPromise]);
      
      if (result && result.error) {
        console.error('Database query returned error:', result.error);
        this.onFailure();
        if (fallback !== undefined) {
          return typeof fallback === 'function' ? fallback() : fallback;
        }
        return result;
      }
      
      this.onSuccess();
      return result;
    } catch (error) {
      console.error('Database query exception:', error.message);
      this.onFailure();
      if (fallback !== undefined) {
        return typeof fallback === 'function' ? fallback() : fallback;
      }
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.lastStateChange = Date.now();
      console.log('Circuit Breaker has closed. Database is recovered!');
    }
  }

  onFailure() {
    this.failureCount++;
    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
      console.error(`Circuit Breaker tripped to OPEN! Consecutive failures: ${this.failureCount}`);
    } else if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.lastStateChange = Date.now();
      console.error('Circuit Breaker probe failed. Retripped to OPEN.');
    }
  }
}

export const dbBreaker = new CircuitBreaker();
