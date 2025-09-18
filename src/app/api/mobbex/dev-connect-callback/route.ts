import { NextRequest, NextResponse } from 'next/server';
import { mobbexDevConnectService } from '@/services/mobbexDevConnectService';
import { firebaseDB } from '@/services/firebaseService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectStatus = searchParams.get('connectstatus');
    const connectId = searchParams.get('connectid');
    const userId = searchParams.get('userId');

    // Validate required parameters
    if (!connectStatus || !userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=missing_parameters`
      );
    }

    // Check if connection was successful
    if (connectStatus === 'done' && connectId) {
      try {
        // Get credentials from Mobbex
        const credentialsResponse = await mobbexDevConnectService.getCredentials(connectId);
        
        if (credentialsResponse.result && credentialsResponse.data) {
          // Save credentials to user document
          await firebaseDB.userMobbexCredentials.save(userId, {
            accessToken: credentialsResponse.data.accessToken,
            entity: {
              name: credentialsResponse.data.entity.name,
              logo: credentialsResponse.data.entity.logo?.url,
              taxId: credentialsResponse.data.entity.taxId,
            },
          });

          // Redirect to settings with success message
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?mobbex=success`
          );
        } else {
          throw new Error('Failed to get credentials from Mobbex');
        }
      } catch (error) {
        console.error('Error processing Mobbex Dev Connect callback:', error);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?mobbex=error`
        );
      }
    } else if (connectStatus === 'cancelled') {
      // User cancelled the connection
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?mobbex=cancelled`
      );
    } else {
      // Invalid status
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?mobbex=error`
      );
    }
  } catch (error) {
    console.error('Error in Mobbex Dev Connect callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?mobbex=error`
    );
  }
}
