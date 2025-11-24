'use client';

import ArcadeCard from '@/components/ArcadeCard';
import Avatar from '@/components/Avatar';

interface Player {
  id: string;
  user_hash: string;
  total_workouts: number;
}

interface GameLog {
  id: string;
  event_type: string;
  message: string;
  created_at: string;
}

interface ActiveGame {
  id: string;
  stake: number;
  player_count: number;
  status: 'active' | 'joinable';
  players: Player[];
  logs: GameLog[];
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

interface ActiveGameViewProps {
  activeGame: ActiveGame;
  selectedTab: 'players' | 'log';
  onTabChange: (tab: 'players' | 'log') => void;
  hasSubmittedToday: boolean;
  onSubmitProof: () => void;
  onLeaveGame: () => void;
  chatMessage: string;
  onChatMessageChange: (text: string) => void;
  onSendMessage: () => void;
  sendingMessage: boolean;
  formatDate: (dateStr: string) => string;
}

export default function ActiveGameView({
  activeGame,
  selectedTab,
  onTabChange,
  hasSubmittedToday,
  onSubmitProof,
  onLeaveGame,
  chatMessage,
  onChatMessageChange,
  onSendMessage,
  sendingMessage,
  formatDate,
}: ActiveGameViewProps) {
  const days = ['M', 'T', 'W', 'TH', 'F', 'S', 'S'];
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <>
      <ArcadeCard>
        <div className="text-lg font-extrabold tracking-wide mb-4">MY CURRENT GAME</div>
        <div className="h-4" />

        {activeGame.weekly_schedule && (
          <>
            <div className="flex justify-center gap-1 my-3">
              {days.map((dayLabel, index) => {
                const dayName = dayNames[index];
                const workout = activeGame.weekly_schedule?.[dayName as keyof typeof activeGame.weekly_schedule] || 'Rest';
                return (
                  <div key={index} className="flex-1 text-center min-w-0">
                    <div className="text-xs font-bold text-gray-600 mb-1 tracking-wide">
                      {dayLabel}
                    </div>
                    <div className="text-sm font-semibold text-black">{workout}</div>
                  </div>
                );
              })}
            </div>
            <div className="h-4" />
          </>
        )}

        <div className="flex justify-between mb-4">
          <div className="flex-1 text-center">
            <div className="text-[9px] font-semibold tracking-wide text-gray-600 uppercase mb-1">
              STAKE
            </div>
            <div className="text-lg font-extrabold text-black">
              {activeGame.stake === 0 ? 'FREE / TEST' : `$${activeGame.stake}`}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-[9px] font-semibold tracking-wide text-gray-600 uppercase mb-1">
              POOL
            </div>
            <div className="text-lg font-extrabold text-black">
              ${activeGame.stake * activeGame.player_count}
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-[9px] font-semibold tracking-wide text-gray-600 uppercase mb-1">
              PLAYERS
            </div>
            <div className="text-lg font-extrabold text-black">{activeGame.players.length}/8</div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
          <div className="text-xs font-bold text-black">
            {activeGame.status === 'active' ? 'GAME ACTIVE' : 'WAITING FOR PLAYERS'}
          </div>
          <div className="text-[11px] font-semibold text-gray-600">
            {activeGame.players.length}/8 Players
          </div>
        </div>
      </ArcadeCard>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onTabChange('players')}
          className={`flex-1 border-[3px] border-black py-3 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
            selectedTab === 'players' ? 'bg-black' : 'bg-white'
          }`}
        >
          <div
            className={`text-[11px] font-bold tracking-wide ${
              selectedTab === 'players' ? 'text-white' : 'text-black'
            }`}
          >
            PLAYERS
          </div>
        </button>
        <button
          onClick={() => onTabChange('log')}
          className={`flex-1 border-[3px] border-black py-3 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
            selectedTab === 'log' ? 'bg-black' : 'bg-white'
          }`}
        >
          <div
            className={`text-[11px] font-bold tracking-wide ${
              selectedTab === 'log' ? 'text-white' : 'text-black'
            }`}
          >
            LOG
          </div>
        </button>
      </div>

      <ArcadeCard>
        {selectedTab === 'players' && (
          <>
            <div className="text-lg font-extrabold tracking-wide mb-4">
              PLAYERS ({activeGame.players.length}/8)
            </div>
            <div className="h-4" />
            {activeGame.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center border-2 border-black bg-gray-50 p-3 mb-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="mr-3">
                  <Avatar hash={player.user_hash} size={40} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-black mb-0.5 truncate">
                    0x{player.user_hash.substring(0, 12)}...
                  </div>
                  <div className="text-[10px] font-semibold text-gray-600">
                    {player.total_workouts} workouts
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {selectedTab === 'log' && (
          <>
            <div className="text-lg font-extrabold tracking-wide mb-4">ACTIVITY LOG</div>
            <div className="h-4" />
            {activeGame.logs.length === 0 ? (
              <div className="text-sm font-semibold text-gray-600 text-center py-5">
                No activity yet
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                {activeGame.logs.map((log) => (
                  <div
                    key={log.id}
                    className="border-2 border-black bg-gray-50 p-2.5 mb-2"
                  >
                    <div className="flex justify-between mb-1">
                      <div className="text-[9px] font-bold text-gray-600 tracking-wide uppercase">
                        {log.event_type.toUpperCase()}
                      </div>
                      <div className="text-[9px] font-semibold text-gray-400">
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-black line-clamp-2">
                      {log.message}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4 pt-4 border-t-2 border-gray-200">
              <textarea
                placeholder="Type a message..."
                value={chatMessage}
                onChange={(e) => onChatMessageChange(e.target.value)}
                maxLength={500}
                className="flex-1 border-[3px] border-black bg-white p-3 text-sm font-semibold max-h-[100px] focus:outline-none focus:ring-2 focus:ring-black resize-none"
                disabled={sendingMessage}
              />
              <button
                onClick={onSendMessage}
                disabled={sendingMessage || !chatMessage.trim()}
                className={`bg-black border-[3px] border-black px-5 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                  sendingMessage || !chatMessage.trim() ? 'opacity-60' : ''
                }`}
              >
                {sendingMessage ? (
                  <div className="text-white text-xs font-extrabold tracking-wide">...</div>
                ) : (
                  <div className="text-white text-xs font-extrabold tracking-wide">SEND</div>
                )}
              </button>
            </div>
          </>
        )}
      </ArcadeCard>

      <button
        onClick={onSubmitProof}
        disabled={hasSubmittedToday || activeGame.status !== 'active'}
        className={`w-full bg-black border-4 border-black py-4.5 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
          hasSubmittedToday || activeGame.status !== 'active' ? 'opacity-60' : ''
        }`}
      >
        <div className="text-white text-sm font-extrabold tracking-wide text-center">
          {activeGame.status !== 'active'
            ? `WAITING FOR PLAYERS... (${activeGame.players.length}/8)`
            : hasSubmittedToday
              ? 'PROOF SUBMITTED TODAY ✓'
              : 'SUBMIT WORKOUT PROOF'}
        </div>
      </button>

      {activeGame.status === 'joinable' && (
        <button
          onClick={onLeaveGame}
          className="w-full bg-[#FF4444] border-4 border-black py-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="text-white text-sm font-extrabold tracking-wide text-center">
            LEAVE GAME
          </div>
        </button>
      )}
    </>
  );
}

