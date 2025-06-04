import { NextRequest, NextResponse } from 'next/server';

// Type definitions
interface APIConfig {
  BASE_URL: string;
}

// API Configuration DEV
const API_CONFIG: APIConfig = {
  BASE_URL: 'https://devapi.bvc.dev/extended-edu-registration/v1'
};

// API Configuration PROD
// const API_CONFIG: APIConfig = {
//   BASE_URL: 'https://apim-bvc-prd-001.azure-api.net/extended-edu-registration/v1'
// };

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

    // Create a new URL and copy all parameters except 'endpoint'
    const apiUrl = new URL(`${API_CONFIG.BASE_URL}/${endpoint}`);
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        apiUrl.searchParams.append(key, value);
      }
    });

    console.log('Forwarding GET request to:', apiUrl.toString());

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('Response is not valid JSON, returning as text');
      data = { text: responseText };
    }

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

    // Special handling for payment/submit-payment endpoint
    let apiUrl: URL;
    
    if (endpoint === 'sitecorexm.api/payment/submit-payment') {
      apiUrl = new URL(`${API_CONFIG.BASE_URL}/sitecorexm.api/payment/submit-payment`);
    } else {
      apiUrl = new URL(`${API_CONFIG.BASE_URL}/${endpoint}`);
    }
    
    // Copy all URL parameters except 'endpoint'
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        apiUrl.searchParams.append(key, value);
      }
    });
    
    console.log('Forwarding POST request to:', apiUrl.toString());

    let body = null;
    const contentType = request.headers.get('Content-Type');
    
    // If the request has a JSON body, try to parse it
    if (contentType && contentType.includes('application/json')) {
      try {
        const requestClone = request.clone();
        body = await requestClone.json();
        console.log('Request includes JSON body:', body);
      } catch (e) {
        console.log('No JSON body or parsing error');
      }
    }

    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Authorization': token,
        'accept': 'text/plain'
      }
    };
    
    // Add the body if it exists
    if (body) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'application/json'
      };
      fetchOptions.body = JSON.stringify(body);
    }

    console.log('Fetch options:', fetchOptions);
    
    const response = await fetch(apiUrl.toString(), fetchOptions);
    
    // Try to get response as JSON, fall back to text if JSON parsing fails
    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('Response is not valid JSON, returning as text');
      data = { text: responseText };
    }

    // Special handling for payment URLs
    if (endpoint === 'sitecorexm.api/payment/submit-payment' && data.result && data.result.paymentUrl) {
      console.log('Payment URL found in response:', data.result.paymentUrl);
    }

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