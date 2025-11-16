'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WeeklySplitCard from '@/components/WeeklySplitCard';
import ProfitCard from '@/components/ProfitCard';
import ActivityFeedGym from '@/components/ActivityFeedGym';
import ActionButton from '@/components/ActionButton';
import GuestView from '@/components/GuestView';
import LoginModal from '@/components/modals/LoginModal';
import { useAuth } from '@/hooks/useAuth';
import { getStats, addWorkout } from '@/lib/userService';
import { canLogWorkoutToday as checkCanLogWorkoutToday } from '@/lib/homepageUtils';
import { getUserActiveGame, getGameDetails } from '@/lib/gameService';
import { getActivityFeed, voteOnProof, removeVote, getVoteCounts, getUserVotes } from '@/lib/activityService';
import { formatDate } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';

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

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading, getUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [activeGame, setActiveGame] = useState<any>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<any>(undefined);
  const [currentDay, setCurrentDay] = useState('No split set');
  const [profitMade, setProfitMade] = useState(0);
  const [canLogWorkoutToday, setCanLogWorkoutToday] = useState(true);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [splitModalVisible, setSplitModalVisible] = useState(false);
  const [splitInput, setSplitInput] = useState('');
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [userHash, setUserHash] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const profile = await getUserProfile();
      if (!profile) {
        setLoading(false);
        return;
      }

      setUserHash(profile.hash);

      // Load user stats
      const stats = await getStats(profile.hash);
      setProfitMade(stats.profitMade);
      setCurrentDay(stats.currentSplitDay || 'No split set');

      const canLog = await checkCanLogWorkoutToday(profile.hash);
      setCanLogWorkoutToday(canLog ?? true);

      // Check for active game
      const activeGameData = await getUserActiveGame(profile.hash);
      if (activeGameData) {
        const gameDetails = await getGameDetails(activeGameData.id);
        setHasActiveGame(true);
        setActiveGame(gameDetails);
        
        if (gameDetails?.weekly_schedule) {
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
          const today = days[new Date().getDay()];
          const todayWorkout = gameDetails.weekly_schedule[today as keyof typeof gameDetails.weekly_schedule] || 'Rest';
          setCurrentDay(todayWorkout);
          setWeeklySchedule(gameDetails.weekly_schedule);
        }
      } else {
        setHasActiveGame(false);
        setActiveGame(null);
      }

      // Load activity feed
      await loadFeed(profile.hash);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeed = async (hash: string) => {
    try {
      const allActivityLogs = await getActivityFeed();
      
      const allProofIds = allActivityLogs
        .filter(log => log.typeofmessage === 'workout' || log.typeofmessage === 'proof')
        .map(log => log.id);

      const [voteCounts, userVotesMap] = await Promise.all([
        getVoteCounts(allProofIds),
        getUserVotes ? getUserVotes(allProofIds, hash) : Promise.resolve(new Map()),
      ]);

      const sortedLogs = allActivityLogs
        .sort((a, b) => new Date(b.timestep).getTime() - new Date(a.timestep).getTime())
        .slice(0, 50);

      const items: FeedItem[] = sortedLogs.map(log => {
        const counts = voteCounts.get(log.id) || { approvals: 0, rejections: 0 };
        const userVote = userVotesMap?.get(log.id) || null;

        return {
          id: log.id.toString(),
          userHash: log.user_hash,
          action: log.message,
          timestamp: formatDate(log.timestep),
          type: log.typeofmessage as 'workout' | 'proof' | 'comment' | 'bet' | 'win' | 'loss' | 'leave',
          image: log.image,
          approvals: counts.approvals,
          rejections: counts.rejections,
          userVote: userVote,
        };
      });

      setFeedItems(items);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  const handleVote = async (id: string, voteType: 'approve' | 'reject') => {
    if (!userHash) return;

    try {
      const activityLogId = parseInt(id);
      const result = await voteOnProof(activityLogId, userHash, voteType);
      
      if (result.ok) {
        // Reload feed to update vote counts
        if (userHash) {
          await loadFeed(userHash);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleRefresh = async () => {
    if (userHash) {
      await loadFeed(userHash);
    }
  };

  const handleLogWorkout = () => {
    setSplitModalVisible(true);
  };

  const handleSubmitWorkout = async () => {
    if (!splitInput.trim() || !userHash) {
      alert('Please enter the workout for today (e.g., Push, Pull, Legs)');
      return;
    }

    try {
      const result = await addWorkout(userHash, splitInput.trim());
      if (result.ok) {
        setSplitModalVisible(false);
        setSplitInput('');
        await loadData(); // Reload all data
      } else {
        alert(result.error?.message || 'Failed to log workout');
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <GuestView
          title="Welcome to GymBet!"
          subtitle="Join the discipline challenge community. Bet on your goals and win rewards!"
          onLoginPress={() => setLoginModalVisible(true)}
        />
        <LoginModal
          visible={loginModalVisible}
          onClose={() => setLoginModalVisible(false)}
        />
      </>
    );
  }

  return (
    <div className="h-full relative overflow-hidden">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: 'url(/AppBackground.jpg)',
        }}
      />
      <div className="relative z-10 h-full pt-8 pb-5 px-2.5 lg:px-8 lg:pt-10 lg:pb-8 overflow-y-auto">
        {/* Mobile Layout */}
        <div className="max-w-md mx-auto px-5 lg:hidden">
          <WeeklySplitCard
            hasActiveGame={hasActiveGame}
            weeklySchedule={hasActiveGame ? weeklySchedule : undefined}
            currentDay={currentDay}
            canLogWorkout={canLogWorkoutToday}
            onPress={handleLogWorkout}
          />

          <ProfitCard profit={profitMade} />

          <ActivityFeedGym items={feedItems} onVote={handleVote} onRefresh={handleRefresh} />

          {!hasActiveGame && (
            <>
              <ActionButton
                text="CREATE NEW GAME"
                primary
                onClick={() => router.push('/bets')}
              />

              <ActionButton
                text="JOIN RANDOM GAME"
                onClick={() => router.push('/bets')}
              />
            </>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Left Column - Stats */}
            <div className="col-span-12 lg:col-span-4 flex flex-col space-y-6">
              <WeeklySplitCard
                hasActiveGame={hasActiveGame}
                weeklySchedule={hasActiveGame ? weeklySchedule : undefined}
                currentDay={currentDay}
                canLogWorkout={canLogWorkoutToday}
                onPress={handleLogWorkout}
              />
              <ProfitCard profit={profitMade} />
              {!hasActiveGame && (
                <div className="space-y-4">
                  <ActionButton
                    text="CREATE NEW GAME"
                    primary
                    onClick={() => router.push('/bets')}
                  />
                  <ActionButton
                    text="JOIN RANDOM GAME"
                    onClick={() => router.push('/bets')}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Activity Feed */}
            <div className="col-span-12 lg:col-span-8">
              <ActivityFeedGym items={feedItems} onVote={handleVote} onRefresh={handleRefresh} />
            </div>
          </div>
        </div>
      </div>

      {/* Workout Log Modal */}
      {splitModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-5">
          <div className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-xl font-extrabold tracking-wide mb-2 text-center">
              LOG WORKOUT
            </div>
            <div className="text-sm font-semibold text-gray-600 mb-5 text-center">
              What's your split today?
            </div>

            <input
              type="text"
              value={splitInput}
              onChange={(e) => setSplitInput(e.target.value)}
              placeholder="e.g., Push, Pull, Legs"
              className="w-full border-[3px] border-black bg-white p-4 text-2xl font-extrabold text-center mb-5 focus:outline-none focus:ring-2 focus:ring-black"
              maxLength={50}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setSplitModalVisible(false)}
                className="flex-1 bg-white border-[3px] border-black p-3.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="text-xs font-extrabold tracking-wide text-black">CANCEL</div>
              </button>
              <button
                onClick={handleSubmitWorkout}
                className="flex-1 bg-black border-[3px] border-black p-3.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="text-xs font-extrabold tracking-wide text-white">LOG</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
