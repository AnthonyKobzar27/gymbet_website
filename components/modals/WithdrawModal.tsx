'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { requestWithdrawal } from '@/lib/stripe_utils';

interface WithdrawModalProps {
  visible: boolean;
  onClose: () => void;
  onWithdraw: (amount: number) => void;
  maxAmount: number;
}

export default function WithdrawModal({
  visible,
  onClose,
  onWithdraw,
  maxAmount,
}: WithdrawModalProps) {
  const { getUserProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleWithdraw = async () => {
    setError(null);
    const withdrawAmount = parseFloat(amount);
    
    if (!amount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > maxAmount) {
      setError(`Insufficient balance. Maximum: $${maxAmount.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const profile = await getUserProfile();
      if (!profile) {
        setError('Please login to withdraw');
        setLoading(false);
        return;
      }

      // Call Stripe withdrawal edge function
      const result = await requestWithdrawal(withdrawAmount, profile.hash);
      
      if (!result.ok) {
        setError(result.error || 'Failed to process withdrawal');
        setLoading(false);
        return;
      }

      // Success - call the callback to refresh balance
      setAmount('');
      onClose();
      onWithdraw(withdrawAmount); // This will trigger balance refresh in parent
      
      alert(
        `Your withdrawal of $${withdrawAmount.toFixed(2)} has been requested.\n\nFunds will be processed within 1-3 business days.`
      );
    } catch (error: any) {
      setError(error.message || 'Failed to process withdrawal');
      console.error('Withdrawal error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-5">
      <div className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-extrabold tracking-wide">WITHDRAW FUNDS</div>
          <button onClick={onClose} className="text-xl font-extrabold text-black" disabled={loading}>
            X
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border-2 border-red-500">
            <div className="text-sm font-bold text-red-700">{error}</div>
          </div>
        )}

        <div className="mb-4">
          <div className="text-sm font-bold text-gray-600 mb-2">
            Available Balance: ${maxAmount.toFixed(2)}
          </div>
          <div className="text-[11px] font-bold text-gray-600 tracking-wide uppercase mb-2">
            AMOUNT ($)
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            max={maxAmount}
            className="w-full border-[3px] border-black bg-white p-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-white border-[3px] border-black p-3.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="text-xs font-extrabold tracking-wide text-black">CANCEL</div>
          </button>
          <button
            onClick={handleWithdraw}
            disabled={loading}
            className={`flex-1 bg-black border-[3px] border-black p-3.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              loading ? 'opacity-60' : ''
            }`}
          >
            {loading ? (
              <div className="text-xs font-extrabold tracking-wide text-white">Processing...</div>
            ) : (
              <div className="text-xs font-extrabold tracking-wide text-white">WITHDRAW</div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


