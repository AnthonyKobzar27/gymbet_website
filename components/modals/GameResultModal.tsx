'use client';

import { supabase } from '@/lib/supabase';

interface GameResultModalProps {
  visible: boolean;
  type: 'win' | 'loss';
  amount: number;
  message: string;
  userHash: string;
  onClose: () => void;
}

export default function GameResultModal({
  visible,
  type,
  amount,
  message,
  userHash,
  onClose,
}: GameResultModalProps) {
  if (!visible) return null;

  const handleClose = async () => {
    // Delete the login modal entry from database
    await supabase
      .from('login_modals')
      .delete()
      .eq('user_hash', userHash);
    
    onClose();
  };

  const isWin = type === 'win';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-5" style={{
      backgroundImage: 'url(/AppBackground.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: '#fdcff3', // Fallback color matching BackgroundImage
    }}>
      <div className="bg-white border-4 border-black w-full max-w-md shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="text-center mb-6">
          <div className={`text-3xl font-extrabold tracking-wide mb-2 ${
            isWin ? 'text-green-600' : 'text-red-600'
          }`}>
            {isWin ? 'WON' : 'LOST'}
          </div>
          <div className="text-2xl font-extrabold text-black">
            ${amount.toFixed(2)}
          </div>
        </div>
        
        <button
          onClick={handleClose}
          className="w-full bg-black border-4 border-black py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="text-white text-base font-extrabold tracking-wide text-center">
            GOT IT
          </div>
        </button>
      </div>
    </div>
  );
}

