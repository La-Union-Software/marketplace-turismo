import { NextRequest, NextResponse } from 'next/server';
import { firebaseDB } from '@/services/firebaseService';

/**
 * Handles the OAuth callback from MercadoPago
 * This endpoint receives the authorization code and exchanges it for an access token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔔 [MercadoPago OAuth Callback] Received:', {
      hasCode: !!code,
      hasState: !!state,
      error
    });

    // Check if user denied authorization
    if (error) {
      console.error('❌ [MercadoPago OAuth Callback] User denied authorization:', error);
      return NextResponse.redirect(
        new URL('/dashboard/settings?oauth=error&message=Authorization denied by user', request.url)
      );
    }

    // Validate code parameter
    if (!code) {
      console.error('❌ [MercadoPago OAuth Callback] No authorization code received');
      return NextResponse.redirect(
        new URL('/dashboard/settings?oauth=error&message=No authorization code received', request.url)
      );
    }

    // Get environment variables
    const appId = process.env.MERCADOPAGO_APP_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/oauth/callback`
      : `${request.nextUrl.origin}/api/mercadopago/oauth/callback`;

    if (!appId || !clientSecret) {
      console.error('❌ [MercadoPago OAuth Callback] Missing configuration');
      return NextResponse.redirect(
        new URL('/dashboard/settings?oauth=error&message=OAuth configuration missing', request.url)
      );
    }

    console.log('🔄 [MercadoPago OAuth Callback] Exchanging code for access token...');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: appId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ [MercadoPago OAuth Callback] Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      });
      return NextResponse.redirect(
        new URL('/dashboard/settings?oauth=error&message=Failed to exchange authorization code', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    
    console.log('✅ [MercadoPago OAuth Callback] Access token received:', {
      hasAccessToken: !!tokenData.access_token,
      hasPublicKey: !!tokenData.public_key,
      tokenType: tokenData.token_type,
      userId: tokenData.user_id
    });

    // Get user ID from query params (should be passed via state in production)
    // For now, we'll get the first superadmin user
    const users = await firebaseDB.users.getAll();
    const superadmin = users.find(u => u.roles.some(r => r.roleName === 'superadmin' && r.isActive));
    
    if (!superadmin) {
      console.error('❌ [MercadoPago OAuth Callback] No superadmin found');
      return NextResponse.redirect(
        new URL('/dashboard/settings?oauth=error&message=No superadmin user found', request.url)
      );
    }

    // Save the account credentials to Firebase
    await firebaseDB.systemSettings.saveMercadoPagoAccount({
      accessToken: tokenData.access_token,
      publicKey: tokenData.public_key,
      userId: tokenData.user_id || 'unknown',
      isActive: true,
      updatedBy: superadmin.id
    }, superadmin.id);

    console.log('✅ [MercadoPago OAuth Callback] Account saved to Firebase');

    // Redirect back to settings page with success message
    return NextResponse.redirect(
      new URL('/dashboard/settings?oauth=success&message=MercadoPago account connected successfully', request.url)
    );

  } catch (error) {
    console.error('❌ [MercadoPago OAuth Callback] Unexpected error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?oauth=error&message=Unexpected error during OAuth callback', request.url)
    );
  }
}

