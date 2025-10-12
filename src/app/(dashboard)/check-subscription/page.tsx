'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function CheckSubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    if (!user?.id) {
      setError('User not logged in');
      return;
    }

    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔍 [Check Subscription] Checking subscription status for user:', user.id);

      const response = await fetch(`/api/mercadopago/check-subscription-status?userId=${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check subscription status');
      }

      console.log('✅ [Check Subscription] Status check result:', data);
      setResult(data);

      // If any subscription was updated, refresh user data
      const wasUpdated = data.results?.some((r: any) => r.updated);
      if (wasUpdated && refreshUser) {
        console.log('🔄 [Check Subscription] Refreshing user data...');
        setTimeout(() => {
          refreshUser();
        }, 2000);
      }

    } catch (err) {
      console.error('❌ [Check Subscription] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'authorized':
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
      case 'paused':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authorized':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'paused':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Check Subscription Status</h1>
        <p className="text-gray-600 mt-1">
          Manually verify and update your subscription status from MercadoPago
        </p>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>What does this do?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            This tool checks your subscription status directly from MercadoPago and updates 
            it in our database if needed.
          </p>
          <p className="font-semibold text-gray-900">Use this if:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Your subscription shows as "pending" but payment was completed</li>
            <li>Your Publisher role wasn't assigned after payment</li>
            <li>You want to verify your current subscription status</li>
          </ul>
        </CardContent>
      </Card>

      {/* Check Button */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={handleCheckStatus}
          disabled={isChecking || !user}
          size="lg"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              Check Subscription Status
            </>
          )}
        </Button>
        {!user && (
          <span className="text-sm text-red-600">Please log in to check subscription status</span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-semibold">Error:</span>
              <span className="text-red-700 ml-2">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              Subscription Check Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Subscriptions Checked</p>
                <p className="text-2xl font-bold text-blue-600">{result.checked}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Updated</p>
                <p className="text-2xl font-bold text-green-600">
                  {result.results?.filter((r: any) => r.updated).length || 0}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">No Changes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {result.results?.filter((r: any) => !r.updated && r.status !== 'error').length || 0}
                </p>
              </div>
            </div>

            {/* Detailed Results */}
            {result.results?.map((sub: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(sub.mercadoPagoStatus || sub.firebaseStatus)}
                    <span className="font-semibold">Subscription {index + 1}</span>
                  </div>
                  {sub.updated && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                      UPDATED
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Subscription ID (Firebase)</p>
                    <p className="font-mono text-xs">{sub.subscriptionId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">MercadoPago ID</p>
                    <p className="font-mono text-xs">{sub.mercadoPagoId}</p>
                  </div>
                </div>

                {sub.mercadoPagoDetails && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Firebase Status</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(sub.firebaseStatus)}`}>
                          {sub.firebaseStatus}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-600">MercadoPago Status</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(sub.mercadoPagoStatus)}`}>
                          {sub.mercadoPagoStatus}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="text-gray-600">Plan Name</p>
                      <p className="font-semibold">{sub.mercadoPagoDetails.reason}</p>
                    </div>

                    {sub.mercadoPagoDetails.payer_email && (
                      <div className="text-sm">
                        <p className="text-gray-600">Payer Email</p>
                        <p className="font-mono text-xs">{sub.mercadoPagoDetails.payer_email}</p>
                      </div>
                    )}

                    {sub.mercadoPagoDetails.auto_recurring && (
                      <div className="text-sm">
                        <p className="text-gray-600">Billing</p>
                        <p>
                          {sub.mercadoPagoDetails.auto_recurring.transaction_amount}{' '}
                          {sub.mercadoPagoDetails.auto_recurring.currency_id} every{' '}
                          {sub.mercadoPagoDetails.auto_recurring.frequency}{' '}
                          {sub.mercadoPagoDetails.auto_recurring.frequency_type}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                      <div>
                        <p>Created:</p>
                        <p>{new Date(sub.mercadoPagoDetails.date_created).toLocaleString()}</p>
                      </div>
                      <div>
                        <p>Last Modified:</p>
                        <p>{new Date(sub.mercadoPagoDetails.last_modified).toLocaleString()}</p>
                      </div>
                    </div>
                  </>
                )}

                {sub.status === 'error' && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      <span className="font-semibold">Error:</span> {sub.message}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {result.results?.some((r: any) => r.updated) && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-semibold">
                    Status updated successfully! Refreshing your user data...
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">If status is still "pending":</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Check if payment was actually processed in MercadoPago</li>
            <li>Wait a few minutes and try checking again</li>
            <li>Verify webhook URL is configured in MercadoPago</li>
            <li>Check server logs for webhook errors</li>
          </ol>
          
          <p className="font-semibold text-gray-900 mt-4">If Publisher role is missing:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Make sure subscription status is "authorized" or "active"</li>
            <li>Refresh this page after status update</li>
            <li>Log out and log back in</li>
            <li>Contact support if issue persists</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
