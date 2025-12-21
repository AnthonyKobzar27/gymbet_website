'use client';

import { useState } from 'react';
import { createGame } from '@/lib/gameService';

interface CreateGameModalProps {
  visible: boolean;
  onClose: () => void;
  onGameCreated: () => void;
}

interface WeeklySchedule {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export default function CreateGameModal({
  visible,
  onClose,
  onGameCreated,
}: CreateGameModalProps) {
  const [schedule, setSchedule] = useState<WeeklySchedule>({
    monday: 'Push',
    tuesday: 'Pull',
    wednesday: 'Legs',
    thursday: 'Push',
    friday: 'Pull',
    saturday: 'Legs',
    sunday: 'Rest',
  });
  const [stake, setStake] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleCreateGame = async () => {
    setError(null);

    if (stake === '' || stake === null || stake === undefined) {
      setError('Please enter a stake amount');
      return;
    }

    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum) || stakeNum < 0) {
      setError('Please enter a valid stake amount');
      return;
    }

    // Allow $0 (FREE) or minimum $1
    if (stakeNum !== 0 && stakeNum < 1) {
      setError('Minimum stake is $1 or FREE ($0)');
      return;
    }

    if (stakeNum > 100) {
      setError('Maximum stake is $100');
      return;
    }

    setLoading(true);
    try {
      const result = await createGame(schedule, stakeNum);
      if (result.ok) {
        onClose();
        setSchedule({
          monday: 'Push',
          tuesday: 'Pull',
          wednesday: 'Legs',
          thursday: 'Push',
          friday: 'Pull',
          saturday: 'Legs',
          sunday: 'Rest',
        });
        setStake('10');
        onGameCreated();
      } else {
        setError(result.error?.message || 'Failed to create game');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error creating game:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (day: keyof WeeklySchedule, value: string) => {
    setSchedule({ ...schedule, [day]: value });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-5" style={{
      backgroundImage: 'url(/AppBackground.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-xl font-extrabold tracking-wide mb-2 text-center">
          CREATE NEW GAME
        </div>
        <div className="text-sm font-semibold text-gray-600 mb-5 text-center">
          Set your weekly workout split
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-100 border-2 border-red-500">
            <div className="text-sm font-bold text-red-700">{error}</div>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            {(['monday', 'tuesday', 'wednesday', 'thursday'] as const).map((day) => (
              <div key={day} className="mb-2.5">
                <div className="text-[10px] font-bold tracking-wide text-gray-600 mb-1 uppercase">
                  {day.substring(0, 3).toUpperCase()}
                </div>
                <input
                  type="text"
                  value={schedule[day]}
                  onChange={(e) => updateDay(day, e.target.value)}
                  placeholder={day === 'monday' ? 'Push' : day === 'tuesday' ? 'Pull' : day === 'wednesday' ? 'Legs' : 'Push'}
                  className="w-full border-2 border-black bg-white p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            ))}
          </div>

          <div className="flex-1">
            {(['friday', 'saturday', 'sunday'] as const).map((day) => (
              <div key={day} className="mb-2.5">
                <div className="text-[10px] font-bold tracking-wide text-gray-600 mb-1 uppercase">
                  {day.substring(0, 3).toUpperCase()}
                </div>
                <input
                  type="text"
                  value={schedule[day]}
                  onChange={(e) => updateDay(day, e.target.value)}
                  placeholder={day === 'friday' ? 'Pull' : day === 'saturday' ? 'Legs' : 'Rest'}
                  className="w-full border-2 border-black bg-white p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-[11px] font-bold tracking-wide text-gray-600 mb-2 uppercase mt-3">
            STAKE AMOUNT ($)
          </div>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder="10"
            className="w-full border-[3px] border-black bg-white p-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-white border-[3px] border-black p-3.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="text-xs font-extrabold tracking-wide text-black">CANCEL</div>
          </button>
          <button
            onClick={handleCreateGame}
            disabled={loading}
            className={`flex-1 bg-black border-[3px] border-black p-3.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
              loading ? 'opacity-60' : ''
            }`}
          >
            {loading ? (
              <div className="text-xs font-extrabold tracking-wide text-white">Creating...</div>
            ) : (
              <div className="text-xs font-extrabold tracking-wide text-white">CREATE</div>
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

