'use client';

import ArcadeCard from '@/components/ArcadeCard';

interface Game {
  id: string;
  stake: number;
  player_count: number;
  max_participants: number;
  created_at: string;
  weekly_schedule?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

interface JoinableGamesViewProps {
  joinableGames: Game[];
  onJoinGame: (gameId: string) => void;
  onCreateGame: () => void;
  formatDate: (dateStr: string) => string;
}

export default function JoinableGamesView({
  joinableGames,
  onJoinGame,
  onCreateGame,
  formatDate,
}: JoinableGamesViewProps) {
  const days = ['M', 'T', 'W', 'TH', 'F', 'S', 'S'];
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <>
      <ArcadeCard>
        <div className="text-lg font-extrabold tracking-wide mb-4">JOINABLE GAMES</div>
        <div className="h-4" />

        {joinableGames.length === 0 ? (
          <div className="text-sm font-semibold text-gray-600 text-center py-5">
            No games available. Create one!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {joinableGames.map((game) => (
            <div
              key={game.id}
              className="border-[3px] border-black bg-gray-50 p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-bold text-black">Weekly Split</div>
                <div className="text-base font-extrabold text-[#4CAF50]">${game.stake}</div>
              </div>

              {game.weekly_schedule && (
                <div className="flex justify-evenly my-3 px-1">
                  {days.map((dayLabel, index) => {
                    const dayName = dayNames[index];
                    const workout = game.weekly_schedule?.[dayName as keyof typeof game.weekly_schedule] || 'Rest';
                    return (
                      <div key={index} className="text-center min-w-[36px]">
                        <div className="text-[8px] font-bold text-gray-600 mb-0.5">
                          {dayLabel}
                        </div>
                        <div className="text-[9px] font-semibold text-black">{workout}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between items-center mb-2">
                <div className="text-[11px] font-semibold text-gray-600">
                  {game.player_count}/8 Players
                </div>
                <div className="text-[10px] font-semibold text-gray-400">
                  {formatDate(game.created_at)}
                </div>
              </div>
              <button
                onClick={() => onJoinGame(game.id)}
                className="w-full bg-[#4CAF50] border-2 border-black py-2.5 mt-1 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="text-white text-xs font-extrabold tracking-wide">JOIN GAME →</div>
              </button>
            </div>
          ))}
          </div>
        )}
      </ArcadeCard>

      <button
        onClick={onCreateGame}
        className="w-full bg-black border-4 border-black py-4.5 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="text-white text-sm font-extrabold tracking-wide text-center">
          + CREATE NEW GAME
        </div>
      </button>
    </>
  );
}

