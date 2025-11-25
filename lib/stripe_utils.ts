import { supabase } from './supabase';

/**
 * Calculate fees for a deposit
 * Stripe fee: 2.9% + $0.30
 * Platform fee: 5%
 */
export function calculateFees(amount: number) {
  const stripeFee = amount * 0.029 + 0.30;
  const platformFee = amount * 0.05;
  const total = amount + stripeFee + platformFee;
  
  return {
    amount: amount, // Amount that goes to user's account
    stripeFee: stripeFee,
    platformFee: platformFee,
    total: total, // Total charge to user
  };
}

/**
 * Create a Stripe Checkout Session
 * Opens a hosted Stripe payment page
 * Amount should be in dollars (e.g., 10 for $10)
 */
export async function createCheckoutSession(amount: number, userHash: string): Promise<string> {
  try {
    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        amount: amount, // Amount in dollars, edge function will convert to cents
        userHash: userHash
      },
    });

    if (error) {
      console.error('Failed to create checkout session:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (!data || !data.url) {
      throw new Error('No checkout URL returned from server');
    }

    console.log('Checkout session created successfully');
    return data.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Request a withdrawal (secure - uses Edge Function)
 * Amount should be in dollars (e.g., 50 for $50)
 */
export async function requestWithdrawal(amount: number, userHash: string): Promise<{ ok: boolean; error?: string; withdrawal_id?: string }> {
  console.log('=== requestWithdrawal ===');
  console.log('Amount:', amount);
  console.log('User hash:', userHash);

  try {
    // Call Supabase Edge Function to request withdrawal
    const { data, error } = await supabase.functions.invoke('request-withdrawal', {
      body: {
        amount: amount,
        userHash: userHash
      },
    });

    if (error) {
      console.error('Failed to request withdrawal:', error);
      return { ok: false, error: error.message || 'Failed to request withdrawal' };
    }

    if (!data || !data.success) {
      return { ok: false, error: data?.error || 'Withdrawal request failed' };
    }

    console.log('Withdrawal requested successfully:', data.withdrawal_id);
    return { ok: true, withdrawal_id: data.withdrawal_id };
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}




