import { NextRequest, NextResponse } from 'next/server';
import { firebaseDB } from '@/services/firebaseService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subscriptionId } = await params;
    console.log('Deleting Mobbex subscription from server-side:', subscriptionId);
    
    // Get Mobbex credentials from Firebase
    const credentials = await firebaseDB.systemSettings.getMobbexCredentials();
    
    if (!credentials || !credentials.isActive) {
      return NextResponse.json(
        { error: 'Mobbex credentials not found or inactive' },
        { status: 400 }
      );
    }

    // Delete subscription from Mobbex API
    const response = await fetch(`https://api.mobbex.com/p/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'x-api-key': credentials.apiKey,
        'x-access-token': credentials.accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('Mobbex subscription deleted successfully');
      return NextResponse.json({
        success: true,
        message: 'Subscription deleted successfully'
      });
    } else {
      const errorText = await response.text();
      console.error('Failed to delete subscription:', errorText);
      
      return NextResponse.json(
        { 
          error: 'Failed to delete subscription in Mobbex',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error deleting Mobbex subscription:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
