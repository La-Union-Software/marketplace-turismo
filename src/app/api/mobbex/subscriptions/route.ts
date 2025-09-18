import { NextRequest, NextResponse } from 'next/server';
import { firebaseDB } from '@/services/firebaseService';

export async function GET(request: NextRequest) {
  try {
    console.log('Getting Mobbex subscriptions from server-side...');
    
    // Get Mobbex credentials from Firebase
    const credentials = await firebaseDB.systemSettings.getMobbexCredentials();
    
    if (!credentials || !credentials.isActive) {
      return NextResponse.json(
        { error: 'Mobbex credentials not found or inactive' },
        { status: 400 }
      );
    }

    // Get subscriptions from Mobbex API
    const response = await fetch('https://api.mobbex.com/p/subscriptions', {
      method: 'GET',
      headers: {
        'x-api-key': credentials.apiKey,
        'x-access-token': credentials.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      // Return the raw Mobbex response directly
      return NextResponse.json(data);
    } else {
      const errorText = await response.text();
      return NextResponse.json(
        { 
          error: 'Failed to get subscriptions from Mobbex',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error getting Mobbex subscriptions:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Creating Mobbex subscription from server-side...');
    
    // Get Mobbex credentials from Firebase
    const credentials = await firebaseDB.systemSettings.getMobbexCredentials();
    
    if (!credentials || !credentials.isActive) {
      return NextResponse.json(
        { error: 'Mobbex credentials not found or inactive' },
        { status: 400 }
      );
    }

    // Get subscription data from request body
    const subscriptionData = await request.json();
    
    console.log('Creating subscription with data:', subscriptionData);

    // Create subscription in Mobbex API
    const response = await fetch('https://api.mobbex.com/p/subscriptions', {
      method: 'POST',
      headers: {
        'x-api-key': credentials.apiKey,
        'x-access-token': credentials.accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Subscription created successfully:', data);
      
      // Return the raw Mobbex response directly
      return NextResponse.json(data);
    } else {
      const errorText = await response.text();
      console.error('Failed to create subscription:', errorText);
      
      return NextResponse.json(
        { 
          error: 'Failed to create subscription in Mobbex',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error creating Mobbex subscription:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
