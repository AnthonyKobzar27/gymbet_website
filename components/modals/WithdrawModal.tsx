'use client';

import { useState } from 'react';

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
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    if (!amount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (withdrawAmount > maxAmount) {
      alert(`Insufficient balance. Maximum: $${maxAmount.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      await onWithdraw(withdrawAmount);
      setAmount('');
      onClose();
    } catch (error) {
      alert('Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-5">
      <div className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-extrabold tracking-wide">WITHDRAW FUNDS</div>
          <button onClick={onClose} className="text-xl font-extrabold text-black">
            X
          </button>
        </div>

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

