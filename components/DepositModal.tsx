'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createCheckoutSession, calculateFees } from '@/lib/stripe_utils';

interface DepositModalProps {
  visible: boolean;
  onClose: () => void;
  onDeposit?: (amount: number) => void;
}

const DEPOSIT_AMOUNTS = [10, 25, 50, 100];

export default function DepositModal({ visible, onClose, onDeposit }: DepositModalProps) {
  const { getUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  if (!visible) return null;

  const handleDeposit = async (amount: number) => {
    setError(null);
    
    // Validate minimum amount
    if (amount < 5) {
      setError('Minimum deposit amount is $5.00');
      return;
    }

    setSelectedAmount(amount);
    setLoading(true);

    try {
      const profile = await getUserProfile();
      if (!profile) {
        setError('Please login to deposit');
        setLoading(false);
        setSelectedAmount(null);
        return;
      }

      const fees = calculateFees(amount);
      if (fees.total < 0.50) {
        setError(`Total charge must be at least $0.50 (Stripe requirement)\n\nYour total: $${fees.total.toFixed(2)}`);
        setLoading(false);
        setSelectedAmount(null);
        return;
      }

      // Create Stripe checkout session
      const checkoutUrl = await createCheckoutSession(amount, profile.hash);
      
      // Redirect to Stripe checkout (works better than popup, especially on mobile)
      window.location.href = checkoutUrl;
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Deposit error:', err);
    } finally {
      setLoading(false);
      setSelectedAmount(null);
    }
  };

  const handleCustomDeposit = () => {
    const amount = parseFloat(customAmount);
    if (!customAmount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    handleDeposit(amount);
  };

  // Calculate fees for display - show for custom amount if valid
  const customAmountNum = customAmount ? parseFloat(customAmount) : null;
  const displayAmount = selectedAmount || (customAmountNum && customAmountNum >= 5 ? customAmountNum : null);
  const fees = displayAmount ? calculateFees(displayAmount) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-5">
      <div className="bg-[#fdcff3] border-4 border-black p-5 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center w-full mb-2.5">
          <div className="text-xl font-extrabold text-black mb-2.5">DEPOSIT</div>
          <button onClick={onClose} className="text-xl font-extrabold text-black" disabled={loading}>
            X
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500">
            <div className="text-sm font-bold text-red-700">{error}</div>
          </div>
        )}

        <div className="space-y-2.5">
          {DEPOSIT_AMOUNTS.map((amount) => {
            const isSelected = selectedAmount === amount && loading;
            return (
              <button
                key={amount}
                onClick={() => handleDeposit(amount)}
                disabled={loading}
                className={`w-full bg-white border-2 border-black py-3.5 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  loading ? 'opacity-60' : ''
                }`}
              >
                {isSelected ? (
                  <div className="text-black text-lg font-semibold tracking-wide">Processing...</div>
                ) : (
                  <div className="text-black text-2xl font-semibold tracking-wide">
                    ${amount}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Amount Input */}
        <div className="mt-4 space-y-2">
          <div className="text-xs font-extrabold text-black tracking-wide">OR ENTER CUSTOM AMOUNT</div>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setError(null);
                }}
                placeholder="Min $5.00"
                step="0.01"
                min="5"
                disabled={loading}
                className="w-full border-2 border-black bg-white p-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
              />
            </div>
            <button
              onClick={handleCustomDeposit}
              disabled={loading || !customAmount || parseFloat(customAmount) < 5}
              className="bg-black border-2 border-black px-4 py-3 text-white font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              DEPOSIT
            </button>
          </div>
          {customAmount && parseFloat(customAmount) > 0 && (
            <div className="text-xs text-gray-600">
              Minimum: $5.00
            </div>
          )}
        </div>
        
        {fees && (
          <div className="mt-4 bg-white border-2 border-black p-3 text-xs">
            <div className="text-xs font-extrabold mb-2">FEE BREAKDOWN:</div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Account Credit:</span>
              <span className="font-bold">${fees.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Processing Fee:</span>
              <span className="font-bold">${fees.stripeFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="font-semibold">Platform Fee:</span>
              <span className="font-bold">${fees.platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t-2 border-black">
              <span className="font-extrabold">Total Charge:</span>
              <span className="font-extrabold">${fees.total.toFixed(2)}</span>
            </div>
          </div>
        )}
        
        {!loading && (
          <div className="mt-4 text-xs text-gray-600 text-center">
            You&apos;ll be redirected to secure Stripe checkout
          </div>
        )}
      </div>
    </div>
  );
}

