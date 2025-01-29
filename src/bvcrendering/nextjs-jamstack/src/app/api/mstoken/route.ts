import { NextResponse } from 'next/server';

const TENANT_ID = '8f11c6f4-648e-4c0c-bb99-96e8408a8e2a';
const CLIENT_ID = 'd961fcdb-4e7e-4298-af79-48f237caaf28';
const CLIENT_SECRET = 'kTv8Q~tL7.GeeFM.exnobRiP6BqtCHgaerywQbQI';
const SCOPE = 'api://a4cfac5e-d4c2-4452-bf83-cdc5f8df0daa/.default';

export async function POST() {
  try {
    // Prepare the form data
    const formData = new URLSearchParams();
    formData.append('grant_type', 'client_credentials');
    formData.append('client_id', CLIENT_ID);
    formData.append('client_secret', CLIENT_SECRET);
    formData.append('scope', SCOPE);

    // Make the request to Microsoft's OAuth endpoint
    const response = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    // Get the response data
    const data = await response.json();

    // If the response wasn't successful, throw an error
    if (!response.ok) {
      throw new Error(data.error_description || 'Failed to get token');
    }

    // Return the token response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Token acquisition error:', error);
    return NextResponse.json(
      { error: 'Failed to acquire token' },
      { status: 500 }
    );
  }
}