import { NextRequest, NextResponse } from 'next/server';
import { mobbexDevConnectService } from '@/services/mobbexDevConnectService';
import { firebaseDB } from '@/services/firebaseService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔗 [MobbexCallback] Starting callback processing...');
    const { searchParams } = new URL(request.url);
    const connectStatus = searchParams.get('connectstatus');
    const connectId = searchParams.get('connectid');
    const userId = searchParams.get('userId');

    console.log('📋 [MobbexCallback] Received parameters:', {
      connectStatus,
      connectId,
      userId,
      fullUrl: request.url
    });

    // Validate required parameters
    if (!connectStatus || !userId) {
      console.log('❌ [MobbexCallback] Missing required parameters');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=missing_parameters`
      );
    }

    // Check if connection was successful
    if (connectStatus === 'done' && connectId) {
      try {
        console.log('✅ [MobbexCallback] Connection successful, getting credentials for connectId:', connectId);
        
        // Get credentials from Mobbex
        const credentialsResponse = await mobbexDevConnectService.getCredentials(connectId);
        
        console.log('📋 [MobbexCallback] Credentials response:', {
          result: credentialsResponse.result,
          hasData: !!credentialsResponse.data,
          hasAccessToken: !!credentialsResponse.data?.accessToken,
          hasEntity: !!credentialsResponse.data?.entity,
          entityName: credentialsResponse.data?.entity?.name,
          entityTaxId: credentialsResponse.data?.entity?.taxId
        });
        
        if (credentialsResponse.result && credentialsResponse.data) {
          console.log('💾 [MobbexCallback] Saving credentials to user document for userId:', userId);
          
          // Save credentials to user document
          await firebaseDB.userMobbexCredentials.save(userId, {
            accessToken: credentialsResponse.data.accessToken,
            entity: {
              name: credentialsResponse.data.entity.name,
              logo: credentialsResponse.data.entity.logo?.url,
              taxId: credentialsResponse.data.entity.taxId,
            },
          });

          console.log('✅ [MobbexCallback] Credentials saved successfully, redirecting to settings');
          // Redirect to settings with success message
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?mobbex=success`
          );
        } else {
          console.log('❌ [MobbexCallback] Failed to get credentials from Mobbex');
          throw new Error('Failed to get credentials from Mobbex');
        }
      } catch (error) {
        console.error('❌ [MobbexCallback] Error processing Mobbex Dev Connect callback:', error);
        console.error('❌ [MobbexCallback] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?mobbex=error`
        );
      }
    } else if (connectStatus === 'cancelled') {
      console.log('❌ [MobbexCallback] User cancelled the connection');
      // User cancelled the connection
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?mobbex=cancelled`
      );
    } else {
      console.log('❌ [MobbexCallback] Invalid status:', connectStatus);
      // Invalid status
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?mobbex=error`
      );
    }
  } catch (error) {
    console.error('❌ [MobbexCallback] Error in Mobbex Dev Connect callback:', error);
    console.error('❌ [MobbexCallback] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?mobbex=error`
    );
  }
}
