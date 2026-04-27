// functions/api/data.js
import { db } from '../../firebase-config.js'; // Note: Firebase Admin SDK needed for Workers
// ⚠️ For Cloudflare Workers, use Firebase Admin SDK with service account
// OR keep using client SDK in frontend only (simpler for now)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // For now, redirect to static data or handle via frontend Firestore calls
    // Full CRUD via Workers requires Firebase Admin SDK setup
    return new Response(
      JSON.stringify({ message: 'Use Firestore SDK directly in frontend for now' }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}