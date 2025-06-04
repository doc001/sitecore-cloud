// api/auth-token.mjs

// Azure AD Configuration from environment variables
const AZURE_CONFIG = {
    TENANT_ID: process.env.AZURE_TENANT_ID,
    CLIENT_ID: process.env.AZURE_CLIENT_ID,
    CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
    SCOPE: process.env.AZURE_SCOPE
  };
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  
  export default async function handler(req, res) {
    const { method } = req;
  
    // Set CORS headers for all responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  
    // Handle preflight OPTIONS request
    if (method === 'OPTIONS') {
      return res.status(204).end();
    }
  
    // Only allow POST requests
    if (method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      // Validate environment variables
      const missingVars = [];
      if (!AZURE_CONFIG.TENANT_ID) missingVars.push('AZURE_TENANT_ID');
      if (!AZURE_CONFIG.CLIENT_ID) missingVars.push('AZURE_CLIENT_ID');
      if (!AZURE_CONFIG.CLIENT_SECRET) missingVars.push('AZURE_CLIENT_SECRET');
      if (!AZURE_CONFIG.SCOPE) missingVars.push('AZURE_SCOPE');
  
      if (missingVars.length > 0) {
        console.error('Missing environment variables:', missingVars);
        return res.status(500).json({ 
          error: 'Server configuration error',
          details: `Missing: ${missingVars.join(', ')}`
        });
      }
  
      // Prepare the form data for Azure AD
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', AZURE_CONFIG.CLIENT_ID);
      formData.append('client_secret', AZURE_CONFIG.CLIENT_SECRET);
      formData.append('scope', AZURE_CONFIG.SCOPE);
  
      console.log('Requesting token from Azure AD for tenant:', AZURE_CONFIG.TENANT_ID);
  
      // Make the request to Microsoft's OAuth endpoint
      const tokenUrl = `https://login.microsoftonline.com/${AZURE_CONFIG.TENANT_ID}/oauth2/v2.0/token`;
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'BVC-Auth-Proxy/1.0'
        },
        body: formData.toString(),
      });
  
      // Get the response data
      const data = await response.json();
  
      // If the response wasn't successful, log and return error
      if (!response.ok) {
        console.error('Error response from Microsoft Azure AD:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        
        return res.status(response.status).json({
          error: 'Failed to acquire token',
          details: data.error_description || data.error || 'Unknown error'
        });
      }
  
      console.log('Successfully acquired token from Azure AD');
  
      // Return the token response (but don't log the actual token for security)
      return res.status(200).json({
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        scope: data.scope
      });
  
    } catch (error) {
      console.error('Token acquisition error:', error);
      return res.status(500).json({
        error: 'Failed to acquire token',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }