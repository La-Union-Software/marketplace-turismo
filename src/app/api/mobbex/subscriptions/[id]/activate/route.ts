import { NextRequest, NextResponse } from 'next/server';
import { firebaseDB } from '@/services/firebaseService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Activating Mobbex subscription from server-side:', id);
    
    // Get Mobbex credentials from Firebase
    const credentials = await firebaseDB.systemSettings.getMobbexCredentials();
    
    if (!credentials || !credentials.isActive) {
      return NextResponse.json(
        { error: 'Mobbex credentials not found or inactive' },
        { status: 400 }
      );
    }

    // Activate subscription in Mobbex API
    const response = await fetch(`https://api.mobbex.com/p/subscriptions/${id}?action=activate`, {
      method: 'POST',
      headers: {
        'x-api-key': credentials.apiKey,
        'x-access-token': credentials.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Subscription activated successfully:', data);
      
      return NextResponse.json(data);
    } else {
      const errorText = await response.text();
      console.error('Failed to activate subscription:', errorText);
      
      return NextResponse.json(
        { 
          error: 'Failed to activate subscription in Mobbex',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error activating Mobbex subscription:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
