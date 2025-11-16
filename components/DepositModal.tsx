'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { deposit } from '@/lib/userService';

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

  if (!visible) return null;

  const handleDeposit = async (amount: number) => {
    setError(null);
    setLoading(true);

    try {
      const profile = await getUserProfile();
      if (!profile) {
        setError('Please login to deposit');
        setLoading(false);
        return;
      }

      const result = await deposit(profile.hash, amount);
      if (result.ok) {
        onDeposit?.(amount);
        onClose();
        window.location.reload(); // Reload to update balance
      } else {
        setError(result.error?.message || 'Failed to deposit');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Deposit error:', err);
    } finally {
      setLoading(false);
    }
  };

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
          {DEPOSIT_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => handleDeposit(amount)}
              disabled={loading}
              className={`w-full bg-white border-2 border-black py-3.5 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                loading ? 'opacity-60' : ''
              }`}
            >
              {loading ? (
                <div className="text-black text-lg font-semibold tracking-wide">Processing...</div>
              ) : (
                <div className="text-black text-2xl font-semibold tracking-wide">
                  ${amount}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

