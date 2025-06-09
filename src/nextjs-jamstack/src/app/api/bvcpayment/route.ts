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

// Enhanced CORS headers to handle all common client headers
const corsHeaders: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  // FIXED: Added all common headers that browsers/Webflow might send
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name',
  'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  'Vary': 'Origin'
};

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  // Log the preflight request for debugging
  console.log('OPTIONS preflight request from:', request.headers.get('origin'));
  console.log('Requested headers:', request.headers.get('access-control-request-headers'));
  console.log('Requested method:', request.headers.get('access-control-request-method'));

  return new NextResponse(null, { 
    status: 200, // Changed from default to explicit 200
    headers: corsHeaders 
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const token = request.headers.get('Authorization');

    console.log('GET request from:', request.headers.get('origin'));
    console.log('Endpoint requested:', endpoint);

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
        'Content-Type': 'application/json',
        'User-Agent': 'BVC-Proxy/1.0'
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

    console.log('POST request from:', request.headers.get('origin'));
    console.log('Endpoint requested:', endpoint);

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
        'accept': 'text/plain',
        'User-Agent': 'BVC-Proxy/1.0'
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

// Optional: Add a health check endpoint
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'X-Proxy-Status': 'healthy',
      'X-API-Base': API_CONFIG.BASE_URL
    }
  });
}