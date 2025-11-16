'use client';

import Avatar from './Avatar';

interface ActivityFeedItemProps {
  id: string;
  userHash: string;
  action: string;
  timestamp: string;
  type: 'workout' | 'proof' | 'comment' | 'bet' | 'win' | 'loss' | 'leave';
  image?: string | null;
  approvals?: number;
  rejections?: number;
  userVote?: 'approve' | 'reject' | null;
  canVote?: boolean;
  onVote?: (id: string, voteType: 'approve' | 'reject') => void;
}

export default function ActivityFeedItem({
  id,
  userHash,
  action,
  timestamp,
  type,
  image,
  approvals = 0,
  rejections = 0,
  userVote,
  canVote = false,
  onVote,
}: ActivityFeedItemProps) {
  const displayHash = `0x${userHash.substring(0, 8)}...`;

  return (
    <div className="border-[3px] border-black bg-gray-50 p-3 mb-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center flex-1">
          <div className="mr-2.5">
            <Avatar hash={userHash} size={32} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-black tracking-wide mb-0.5">
              {displayHash}
            </div>
            <div className="text-[9px] font-semibold text-gray-400 tracking-wide">
              {timestamp}
            </div>
          </div>
        </div>
      </div>
      <div
        className={`text-[13px] font-semibold leading-[18px] ${
          type === 'win' ? 'text-green-600' : type === 'loss' ? 'text-red-600' : 'text-black'
        }`}
      >
        {action}
      </div>
      {image && (
        <img
          src={image}
          alt="Proof"
          className="w-full h-48 mt-3 border-2 border-black object-cover"
        />
      )}
      {type === 'proof' && canVote && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onVote?.(id, 'approve')}
            className={`flex-1 border-2 border-black py-2.5 px-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
              userVote === 'approve' ? 'bg-black' : 'bg-white'
            }`}
          >
            <div
              className={`text-[11px] font-bold tracking-wide ${
                userVote === 'approve' ? 'text-white' : 'text-black'
              }`}
            >
              ✓ ACCEPT {approvals > 0 ? `(${approvals})` : ''}
            </div>
          </button>
          <button
            onClick={() => onVote?.(id, 'reject')}
            className={`flex-1 border-2 border-black py-2.5 px-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
              userVote === 'reject' ? 'bg-black' : 'bg-white'
            }`}
          >
            <div
              className={`text-[11px] font-bold tracking-wide ${
                userVote === 'reject' ? 'text-white' : 'text-black'
              }`}
            >
              ✕ REJECT {rejections > 0 ? `(${rejections})` : ''}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

