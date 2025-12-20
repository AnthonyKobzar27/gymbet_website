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
import { getActivityFeed, getAllActivityLogs, voteOnProof, removeVote, getVoteCounts, getUserVotes, getProofsForValidator, getProofsWithValidators, checkPBFTValidation, type ActivityLog } from '@/lib/activityService';
import { formatDate } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackgroundImage from '@/components/BackgroundImage';

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
  canVote?: boolean;
  validationStatus?: 'pending' | 'approved' | 'rejected';
  timestep?: string;
  createdAt?: Date;
  isPending?: boolean;
  timeRemaining?: number;
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
  const [feedMode, setFeedMode] = useState<'proofs' | 'all'>('proofs');
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
      let allActivityLogs: ActivityLog[];
      
      if (feedMode === 'proofs') {
        // Get only proofs for voting
        allActivityLogs = await getActivityFeed();
        console.log(`[HomePage] Received ${allActivityLogs.length} proofs from getActivityFeed`);
      } else {
        // Get all activity logs
        allActivityLogs = await getAllActivityLogs();
        console.log(`[HomePage] Received ${allActivityLogs.length} activity logs from getAllActivityLogs`);
      }

      // Get assigned proofs for this validator
      const assignedProofs = await getProofsForValidator(hash);
      const assignedProofIds = new Set(assignedProofs.map(p => p.id));

      // Separate proofs from other activity
      const proofLogs = allActivityLogs.filter(log => 
        (log.typeofmessage === 'proof' || log.typeofmessage === 'workout') && log.image
      );
      const otherLogs = allActivityLogs.filter(log => 
        log.typeofmessage !== 'proof' && log.typeofmessage !== 'workout'
      );

      const allProofIds = proofLogs.map(log => log.id);

      const [voteCounts, userVotesMap, proofsWithValidators] = await Promise.all([
        getVoteCounts(allProofIds),
        getUserVotes(allProofIds, hash),
        getProofsWithValidators(allProofIds),
      ]);

      // Process proofs with pending status and timer
      const proofItems: FeedItem[] = proofLogs.map(log => {
        const counts = voteCounts.get(log.id) || { approvals: 0, rejections: 0 };
        const userVote = userVotesMap.get(log.id) || null;
        const isAssignedForValidation = assignedProofIds.has(log.id);
        const hasValidatorsAssigned = proofsWithValidators.has(log.id);
        const createdAt = new Date(log.timestep);
        const now = new Date();
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        // Check if proof has reached consensus (can't vote anymore)
        const totalVotes = counts.approvals + counts.rejections;
        const requiredApprovals = log.required_approvals || 0;
        const totalValidators = log.total_validators || 0;
        
        // If proof has validators assigned, use PBFT consensus
        // If proof has NO validators assigned (legacy), use simple majority with 10+ votes
        let hasReachedConsensus = false;
        
        const MIN_VOTES_FOR_DECISION = 10;
        
        // CRITICAL: Proofs need at least 10 votes to reach consensus - if < 10 votes, stay PENDING
        if (totalVotes < MIN_VOTES_FOR_DECISION) {
          hasReachedConsensus = false; // Stay pending, allow voting
        } else if (hasValidatorsAssigned && totalValidators > 0) {
          // PBFT consensus: requires 2/3 majority (only if >= 10 votes)
          hasReachedConsensus = 
            (counts.approvals >= requiredApprovals) ||
            (counts.rejections > (totalValidators - requiredApprovals)) ||
            log.validation_status === 'approved' ||
            log.validation_status === 'rejected';
        } else {
          // Legacy consensus: simple majority with 10+ votes
          // Approve if approvals > rejections AND total votes >= 10
          // Reject if rejections > approvals AND total votes >= 10
          const approvalMajority = counts.approvals > counts.rejections;
          const rejectionMajority = counts.rejections > counts.approvals;
          hasReachedConsensus = 
            approvalMajority ||
            rejectionMajority ||
            log.validation_status === 'approved' ||
            log.validation_status === 'rejected';
        }
        
        // Calculate time remaining first
        const timeRemaining = 48 - hoursSinceCreation;
        
        // Determine validation status FIRST
        // If proof has reached consensus, mark as approved/rejected
        // If proof is older than 48 hours and hasn't reached consensus, still mark as pending (but won't show at top)
        let validationStatus: 'pending' | 'approved' | 'rejected' = 'pending';
        
        // CRITICAL: Check database status first - if already approved/rejected, use that
        if (log.validation_status === 'approved' || log.validation_status === 'rejected') {
          validationStatus = log.validation_status;
        } else if (totalVotes < MIN_VOTES_FOR_DECISION) {
          // CRITICAL: If < 10 votes, always stay PENDING (allow voting)
          validationStatus = 'pending';
        } else if (hasReachedConsensus) {
          if (hasValidatorsAssigned && totalValidators > 0) {
            // PBFT consensus (only reached if >= 10 votes)
            if (counts.approvals >= requiredApprovals) {
              validationStatus = 'approved';
            } else if (counts.rejections > (totalValidators - requiredApprovals)) {
              validationStatus = 'rejected';
            }
          } else {
            // Legacy consensus: simple majority (only reached if >= 10 votes)
            if (counts.approvals > counts.rejections) {
              validationStatus = 'approved';
            } else if (counts.rejections > counts.approvals) {
              validationStatus = 'rejected';
            }
          }
        } else {
          // No consensus reached, stay pending
          validationStatus = 'pending';
        }
        
        // A proof is pending (yellow background, timer) ONLY if validationStatus is 'pending'
        // Approved/rejected proofs should NOT show yellow background or be votable
        const isPending = validationStatus === 'pending';

        // Determine if user can vote:
        // CRITICAL: Only allow voting if proof is actually pending (not approved/rejected)
        // - If proof has validators assigned: user must be assigned AND proof must be pending
        // - If proof has NO validators assigned (legacy): allow anyone to vote if pending (fallback)
        const canVote = validationStatus === 'pending' && (
          hasValidatorsAssigned ? isAssignedForValidation : true
        );

        return {
          id: log.id.toString(),
          userHash: log.user_hash,
          action: log.message,
          timestamp: formatDate(log.timestep),
          type: log.typeofmessage as 'workout' | 'proof',
          image: log.image,
          approvals: counts.approvals,
          rejections: counts.rejections,
          userVote: userVote ?? null,
          canVote,
          createdAt,
          isPending,
          timeRemaining: isPending ? timeRemaining : undefined,
          validationStatus,
          timestep: log.timestep,
        };
      });

      // Process other activity items
      const otherItems: FeedItem[] = otherLogs.map(log => {
        return {
          id: log.id.toString(),
          userHash: log.user_hash,
          action: log.message,
          timestamp: formatDate(log.timestep),
          type: log.typeofmessage as 'comment' | 'bet' | 'win' | 'loss' | 'leave',
          createdAt: new Date(log.timestep),
        };
      });

      // Sort: pending proofs first (newest first), then other proofs, then other activity
      const pendingProofs = proofItems.filter(item => item.isPending);
      const finalizedProofs = proofItems.filter(item => !item.isPending);
      
      // Sort pending proofs by newest first (most recent submissions at top)
      pendingProofs.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

      // Sort finalized proofs by newest first (chronological order)
      finalizedProofs.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      
      // Sort other activity by newest first
      otherItems.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

      // Combine: pending proofs at top (newest first), then finalized proofs, then other activity
      const items = [...pendingProofs, ...finalizedProofs, ...otherItems].slice(0, 50);

      setFeedItems(items);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  const handleVote = async (id: string, voteType: 'approve' | 'reject') => {
    if (!userHash) return;

    try {
      const activityLogId = parseInt(id);
      const currentItem = feedItems.find((item) => item.id === id);
      const isTogglingSameVote = currentItem?.userVote === voteType;

      // Optimistically update UI
      setFeedItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const wasApproved = item.userVote === 'approve';
            const wasRejected = item.userVote === 'reject';
            const isApproving = voteType === 'approve';
            const isRejecting = voteType === 'reject';

            let newApprovals = item.approvals || 0;
            let newRejections = item.rejections || 0;

            if (wasApproved) newApprovals--;
            if (wasRejected) newRejections--;

            if (item.userVote === voteType) {
              return {
                ...item,
                userVote: null,
                approvals: newApprovals,
                rejections: newRejections,
              };
            } else {
              if (isApproving) newApprovals++;
              if (isRejecting) newRejections++;

              return {
                ...item,
                userVote: voteType,
                approvals: newApprovals,
                rejections: newRejections,
              };
            }
          }
          return item;
        })
      );

      if (isTogglingSameVote) {
        const result = await removeVote(activityLogId, userHash);
        if (!result.ok) {
          throw new Error('Failed to remove vote');
        }
      } else {
        const result = await voteOnProof(activityLogId, userHash, voteType);
        if (!result.ok) {
          throw new Error('Failed to submit vote');
        }
      }

      const validation = await checkPBFTValidation(activityLogId);

      // Reload feed to get updated status from database
      await loadFeed(userHash);

      if (validation.status === 'approved') {
        alert('Proof Approved! This proof has been validated by 2/3 majority (PBFT consensus)');
      } else if (validation.status === 'rejected') {
        alert('Proof Rejected. This proof was rejected by the validators');
      }
    } catch (error) {
      console.error('Error voting:', error);
      loadFeed(userHash);
    }
  };

  const handleRefresh = async () => {
    if (userHash) {
      await loadFeed(userHash);
    }
  };

  const handleModeChange = (mode: 'proofs' | 'all') => {
    setFeedMode(mode);
  };

  // Reload feed when mode changes
  useEffect(() => {
    if (userHash) {
      loadFeed(userHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedMode, userHash]);

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
    <div className="min-h-screen relative">
      <BackgroundImage />
      <div className="relative z-10 pt-8 pb-5 px-2.5 lg:px-8 lg:pt-10 lg:pb-8">
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

          <ActivityFeedGym 
            items={feedItems} 
            onVote={handleVote} 
            onRefresh={handleRefresh}
            feedMode={feedMode}
            onModeChange={handleModeChange}
          />

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
              <ActivityFeedGym 
                items={feedItems} 
                onVote={handleVote} 
                onRefresh={handleRefresh}
                feedMode={feedMode}
                onModeChange={handleModeChange}
              />
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
