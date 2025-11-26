'use client';

import { useState, useEffect } from 'react';
import Avatar from './Avatar';
import { getTimeRemaining, isWithin48Hours } from '@/lib/activityService';

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
  validationStatus?: 'pending' | 'approved' | 'rejected';
  timestep?: string;
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
  validationStatus = 'pending',
  timestep,
}: ActivityFeedItemProps) {
  const displayHash = `0x${userHash.substring(0, 8)}...`;
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  // Determine border color based on validation status
  const getBorderColor = () => {
    if (!timestep) return 'border-black';
    
    const within48h = isWithin48Hours(timestep);
    if (within48h) {
      return 'border-yellow-500'; // Yellow for pending (within 48h)
    }
    
    // After 48h, use validation status
    if (validationStatus === 'approved') {
      return 'border-green-500'; // Green for approved
    } else if (validationStatus === 'rejected') {
      return 'border-red-500'; // Red for rejected
    }
    
    return 'border-yellow-500'; // Default to yellow if status unclear
  };

  // Update countdown timer every second
  useEffect(() => {
    if (!timestep) return;

    const updateTimer = () => {
      const remaining = getTimeRemaining(timestep);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timestep]);

  const formatTimeRemaining = () => {
    if (!timeRemaining) return null;
    const { hours, minutes, seconds } = timeRemaining;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Check if this is a proof (workout type with image) - only proofs get colored borders and status
  const isProof = (type === 'workout' || type === 'proof') && image;
  const isPending = isProof && timestep ? isWithin48Hours(timestep) : (isProof && validationStatus === 'pending');

  // Get border color - only for proofs, otherwise default black
  const borderColor = isProof ? getBorderColor() : 'border-black';

  return (
    <div className={`border-[3px] ${borderColor} bg-gray-50 p-3 pb-4 mb-2.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]`}>
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
      <div className="flex items-center justify-between mb-2">
        <div
          className={`text-[13px] font-semibold leading-[18px] ${
            type === 'win' ? 'text-green-600' : type === 'loss' ? 'text-red-600' : 'text-black'
          }`}
        >
          {action}
        </div>
        {/* Only show status badges for proofs */}
        {isProof && (
          <>
            {/* Show countdown timer if within 48 hours */}
            {isPending && timeRemaining && (
              <div className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded border border-yellow-500">
                {formatTimeRemaining()} left
              </div>
            )}
            {/* Show status if after 48 hours */}
            {!isPending && validationStatus && validationStatus !== 'pending' && (
              <div className={`text-[10px] font-bold px-2 py-1 rounded border ${
                validationStatus === 'approved' 
                  ? 'text-green-600 bg-green-100 border-green-500' 
                  : 'text-red-600 bg-red-100 border-red-500'
              }`}>
                {validationStatus === 'approved' ? '✓ APPROVED' : '✕ REJECTED'}
              </div>
            )}
          </>
        )}
      </div>
      {/* Show vote buttons BEFORE the image - only for proofs within 48-hour window */}
      {isProof && isPending && onVote && (
        <div className="flex gap-2 mt-3 w-full">
          <button
            onClick={() => onVote(id, 'approve')}
            className={`flex-1 border-2 border-black py-2.5 px-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
              userVote === 'approve' ? 'bg-black' : 'bg-white'
            }`}
            style={{ flexShrink: 0 }}
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
            onClick={() => onVote(id, 'reject')}
            className={`flex-1 border-2 border-black py-2.5 px-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
              userVote === 'reject' ? 'bg-black' : 'bg-white'
            }`}
            style={{ flexShrink: 0 }}
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
      {image && (
        <div className="mt-3 flex justify-center" style={{ maxHeight: '300px', overflow: 'hidden' }}>
          <img
            src={image}
            alt="Proof"
            className="border-2 border-black object-contain"
            style={{ 
              maxHeight: '300px',
              maxWidth: '100%', 
              width: 'auto',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>
      )}
    </div>
  );
}

