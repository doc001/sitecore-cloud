// api/bvcpayment.mjs
// API Configuration
const API_CONFIG = {
    BASE_URL: 'https://apim-bvc-uat-001.azure-api.net/ths-extended-edu/v1'
  };
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  export default async function handler(req, res) {
    const { method } = req;
  
    // Set CORS headers for all responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  
    // Handle preflight OPTIONS request
    if (method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    try {
      const { endpoint, ...queryParams } = req.query;
      const token = req.headers.authorization;
  
      // Validation
      if (!endpoint) {
        return res.status(400).json({ error: 'Missing endpoint parameter' });
      }
  
      if (!token) {
        return res.status(401).json({ error: 'Missing authorization token' });
      }
  
      if (method === 'GET') {
        return await handleGetRequest(res, queryParams, endpoint, token);
      } else if (method === 'POST') {
        return await handlePostRequest(req, res, queryParams, endpoint, token);
      } else {
        return res.status(405).json({ error: 'Method not allowed' });
      }
  
    } catch (error) {
      console.error('Proxy error:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Proxy request failed' 
      });
    }
  }
  
  async function handleGetRequest(res, queryParams, endpoint, token) {
    // Create API URL and add query parameters
    const apiUrl = new URL(`${API_CONFIG.BASE_URL}/${endpoint}`);
    Object.entries(queryParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => apiUrl.searchParams.append(key, v));
      } else {
        apiUrl.searchParams.append(key, value);
      }
    });
  
    console.log('Forwarding GET request to:', apiUrl.toString());
  
    try {
      const response = await fetch(apiUrl.toString(), {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });
  
      const data = await parseResponse(response);
      return res.status(response.status).json(data);
    } catch (error) {
      console.error('GET request error:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
  }
  
  async function handlePostRequest(req, res, queryParams, endpoint, token) {
    // Special handling for payment/submit-payment endpoint
    let apiUrl;
    
    if (endpoint === 'sitecorexm.api/payment/submit-payment') {
      apiUrl = new URL(`${API_CONFIG.BASE_URL}/sitecorexm.api/payment/submit-payment`);
    } else {
      apiUrl = new URL(`${API_CONFIG.BASE_URL}/${endpoint}`);
    }
    
    // Add query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => apiUrl.searchParams.append(key, v));
      } else {
        apiUrl.searchParams.append(key, value);
      }
    });
    
    console.log('Forwarding POST request to:', apiUrl.toString());
  
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Authorization': token,
        'accept': 'text/plain'
      }
    };
    
    // Add body if it exists
    if (req.body && Object.keys(req.body).length > 0) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(req.body);
      console.log('Request includes JSON body:', req.body);
    }
  
    console.log('Fetch options:', fetchOptions);
    
    try {
      const response = await fetch(apiUrl.toString(), fetchOptions);
      const data = await parseResponse(response);
  
      // Special handling for payment URLs
      if (endpoint === 'sitecorexm.api/payment/submit-payment' && data.result && data.result.paymentUrl) {
        console.log('Payment URL found in response:', data.result.paymentUrl);
      }
  
      return res.status(response.status).json(data);
    } catch (error) {
      console.error('POST request error:', error);
      return res.status(500).json({ error: 'Failed to submit data' });
    }
  }
  
  // Helper function to parse response
  async function parseResponse(response) {
    let data;
    const responseText = await response.text();
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.log('Response is not valid JSON, returning as text');
      data = { text: responseText };
    }
    
    return data;
  }