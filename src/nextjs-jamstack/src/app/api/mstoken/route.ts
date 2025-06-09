// File: /app/api/getToken/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Pull all secrets from env (never commit these to source control).
const TENANT_ID = '8f11c6f4-648e-4c0c-bb99-96e8408a8e2a';
const CLIENT_ID = 'd961fcdb-4e7e-4298-af79-48f237caaf28';
const CLIENT_SECRET = 'kTv8Q~tL7.GeeFM.exnobRiP6BqtCHgaerywQbQI';
const SCOPE = 'api://a4cfac5e-d4c2-4452-bf83-cdc5f8df0daa/.default';

// Allowed origin(s). If you only ever call from Webflow staging, list exactly that URL.
// To allow *all* origins (not recommended if you’re passing credentials), you can use '*'.
const ALLOWED_ORIGINS = [
  'https://bvc-dev.webflow.io',
  'https://bvc-test-jun.webflow.io',
  'https://your-production-site.webflow.io', // Add your production domain
  'http://localhost:3000', // For local development
  'https://nextjs-jamstack-dev.vercel.app' // Your own domain
];

// Helper: given an incoming request’s Origin header, decide which "Access-Control-Allow-Origin" to send.
function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin') ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // If you want to allow everything, return '*'. Otherwise, return an empty string to effectively block.
  return '';
}

// 1) Handle the preflight (OPTIONS). Must return 2xx with CORS headers—and no redirects.
export async function OPTIONS(request: NextRequest) {
  const allowedOrigin = getAllowedOrigin(request);

  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      // Always echo back exactly the Origin that the browser sent (if it’s in your ALLOWED_ORIGINS list).
      'Access-Control-Allow-Origin': allowedOrigin || 'null',
      // If you want to allow credentials (cookies / Authorization), you would also need:
      // 'Access-Control-Allow-Credentials': 'true',

      // The methods your actual request may use:
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      // The headers your front-end is allowed to send. If you only send `Content-Type`, this is fine.
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      // In some cases you might want to expose certain response headers to the browser:
      // 'Access-Control-Expose-Headers': 'Authorization, X-Custom-Header',
    },
  });
}

// 2) Handle the actual POST (client-credentials grant to Microsoft OAuth).
export async function POST(request: NextRequest) {
  try {
    const allowedOrigin = getAllowedOrigin(request);

    // Build the form data for client_credentials grant.
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', CLIENT_ID);
    formData.append('client_secret', CLIENT_SECRET);
    formData.append('scope', SCOPE);

    // Fetch a token from Microsoft
    const oauthResponse = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        // By default, `fetch` follows redirects; if Microsoft ever returns a 3xx,
        // we’ll let fetch follow it. In practice, Microsoft’s token endpoint returns 200 or 400.
      }
    );

    const data = await oauthResponse.json();

    if (!oauthResponse.ok) {
      // Log the full response for debugging (don’t leak secrets to the client)
      console.error('Error response from Microsoft:', data);
      return new NextResponse(
        JSON.stringify({ error: data.error_description ?? 'Failed to get token' }),
        {
          status: oauthResponse.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': allowedOrigin || 'null',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // On success, return the JSON (e.g., { "token_type":"Bearer", "access_token":"eyJ..." })
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin || 'null',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (err) {
    console.error('Token acquisition error:', err);
    const allowedOrigin = getAllowedOrigin(request);

    return new NextResponse(
      JSON.stringify({ error: 'Internal server error while acquiring token' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': allowedOrigin || 'null',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}
