import { NextRequest, NextResponse } from 'next/server';

// Type definitions
// interface APIConfig {
//   BASE_URL: string;
// }

// // API Configuration
// const API_CONFIG: APIConfig = {
//   BASE_URL: 'https://devapi.bvc.dev/extended-edu-registration/v1'
// };

interface APIConfig {
  TENANT_ID: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  SCOPE: string;
  BASE_URL: string;
}

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const token = request.headers.get('Authorization');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const apiUrl = `${API_CONFIG.BASE_URL}/${endpoint}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

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
    const token = request.headers.get('Authorization');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const apiUrl = `${API_CONFIG.BASE_URL}/${endpoint}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

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