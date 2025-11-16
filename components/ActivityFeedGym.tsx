import ActivityFeedItem from './ActivityFeedItem';
import ArcadeCard from './ArcadeCard';

interface FeedItem {
  id: string;
  userHash: string;
  action: string;
  timestamp: string;
  type: 'workout' | 'proof' | 'comment' | 'bet' | 'win' | 'loss' | 'leave';
  image?: string | null;
  approvals?: number;
  rejections?: number;
  userVote?: 'approve' | 'reject' | null;
}

interface ActivityFeedGymProps {
  items: FeedItem[];
  onVote?: (id: string, voteType: 'approve' | 'reject') => void;
  onRefresh?: () => void;
}

export default function ActivityFeedGym({ items, onVote, onRefresh }: ActivityFeedGymProps) {
  return (
    <ArcadeCard>
      <div className="text-lg font-extrabold tracking-wide mb-2">ACTIVITY FEED</div>

      {items.length === 0 ? (
        <div className="text-[13px] font-semibold text-black leading-[18px]">
          No activity yet. Be the first to join a game!
        </div>
      ) : (
        <>
          <div className="max-h-[350px] lg:max-h-[450px] overflow-y-auto">
            {items.map((item) => (
              <ActivityFeedItem
                key={item.id}
                id={item.id}
                userHash={item.userHash}
                action={item.action}
                timestamp={item.timestamp}
                type={item.type}
                image={item.image}
                approvals={item.approvals}
                rejections={item.rejections}
                userVote={item.userVote}
                canVote={item.type === 'proof'}
                onVote={onVote}
              />
            ))}
          </div>

          {onRefresh && (
            <div
              className="mt-2 py-3 border-2 border-black bg-white text-center cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              onClick={onRefresh}
            >
              <div className="text-[10px] font-extrabold tracking-wide">REFRESH ACTIVITY →</div>
            </div>
          )}
        </>
      )}
    </ArcadeCard>
  );
}

