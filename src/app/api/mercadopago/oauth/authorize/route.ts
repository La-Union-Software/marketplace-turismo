import { NextRequest, NextResponse } from 'next/server';

/**
 * Generates the MercadoPago OAuth authorization URL
 * This endpoint creates the URL that redirects users to MercadoPago for authorization
 */
export async function GET(request: NextRequest) {
  try {
    // Get the APP_ID from environment variables
    const appId = process.env.MERCADOPAGO_APP_ID;
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/mercadopago/oauth/callback`
      : `${request.nextUrl.origin}/api/mercadopago/oauth/callback`;

    if (!appId) {
      console.error('❌ [MercadoPago OAuth] MERCADOPAGO_APP_ID not configured');
      return NextResponse.json(
        { error: 'MercadoPago App ID is not configured. Please add MERCADOPAGO_APP_ID to your environment variables.' },
        { status: 500 }
      );
    }

    // Generate a random state parameter for CSRF protection
    const state = Math.random().toString(36).substring(7);

    // Build the OAuth authorization URL
    const authUrl = new URL('https://auth.mercadopago.com/authorization');
    authUrl.searchParams.append('client_id', appId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('platform_id', 'mp');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);

    console.log('✅ [MercadoPago OAuth] Authorization URL generated:', {
      appId: appId.substring(0, 10) + '...',
      redirectUri,
      state
    });

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state
    });

  } catch (error) {
    console.error('❌ [MercadoPago OAuth] Error generating authorization URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}

