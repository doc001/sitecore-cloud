import { NextRequest, NextResponse } from 'next/server';
import TokenManager from './tokenManager';

// Type definitions remain the same
interface APIConfig {
  TENANT_ID: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  SCOPE: string;
  BASE_URL: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface APIError {
  error: string;
  error_description?: string;
}

// API Configuration remains the same
// const API_CONFIG: APIConfig = {
//   TENANT_ID: '8f11c6f4-648e-4c0c-bb99-96e8408a8e2a',
//   CLIENT_ID: 'd961fcdb-4e7e-4298-af79-48f237caaf28',
//   CLIENT_SECRET: 'kTv8Q~tL7.GeeFM.exnobRiP6BqtCHgaerywQbQI',
//   SCOPE: 'api://a4cfac5e-d4c2-4452-bf83-cdc5f8df0daa/.default',
//   BASE_URL: 'https://devapi.bvc.dev/extended-edu-registration/v1'
// };

// API Configuration remains the same
const API_CONFIG: APIConfig = {
  TENANT_ID: '8f11c6f4-648e-4c0c-bb99-96e8408a8e2a',
  CLIENT_ID: '10cc8ef6-137a-4560-8a2b-1d414f3dd0c7',
  CLIENT_SECRET: 'SzJ8Q~xLZRSklU8B0~seCt6rx-WbnHD4olXp4ag~',
  SCOPE: 'api://8bc87c2f-0b25-4ea9-917e-53169be361d3/.default',
  BASE_URL: 'https://apim-bvc-prd-001.azure-api.net/extended-edu-registration/v1'
};

const corsHeaders: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Updated getMsToken function to use TokenManager
async function getMsToken(): Promise<string> {
  try {
    // Check for valid cached token
    const cachedToken = TokenManager.getStoredToken();
    if (cachedToken) {
      return cachedToken.accessToken;
    }

    // If no valid cached token, get a new one
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', API_CONFIG.CLIENT_ID);
    formData.append('client_secret', API_CONFIG.CLIENT_SECRET);
    formData.append('scope', API_CONFIG.SCOPE);

    const response = await fetch(
      `https://login.microsoftonline.com/${API_CONFIG.TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json() as APIError;
      throw new Error(errorData.error_description ?? 'Failed to get access token');
    }

    const data = await response.json() as TokenResponse;
    
    // Store the new token
    TokenManager.storeToken(data.access_token, data.expires_in);
    
    return data.access_token;
  } catch (error) {
    console.error('Token acquisition error:', error);
    throw error;
  }
}

// GET and POST handlers remain the same
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    const token = await getMsToken();
    const apiUrl = `${API_CONFIG.BASE_URL}/${endpoint}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    // Return the response with original status code
    return NextResponse.json(data, { 
      status: response.status, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Proxy GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy request failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    const token = await getMsToken();
    const body = await request.json();
    const apiUrl = `${API_CONFIG.BASE_URL}/${endpoint}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Return the response with original status code
    return NextResponse.json(data, { 
      status: response.status, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Proxy POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy request failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}