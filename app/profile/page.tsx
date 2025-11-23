'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ArcadeCard from '@/components/ArcadeCard';
import ActionButton from '@/components/ActionButton';
import WithdrawModal from '@/components/modals/WithdrawModal';
import Avatar from '@/components/Avatar';
import GuestView from '@/components/GuestView';
import LoginModal from '@/components/modals/LoginModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { getStats } from '@/lib/userService';
import { getBalance, withdraw } from '@/lib/userService';
import { supabase } from '@/lib/supabase';
import BackgroundImage from '@/components/BackgroundImage';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, getUserProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userHash, setUserHash] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

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
      setUsername(profile.username);
      setEmail(profile.email);

      // Load balance
      const userBalance = await getBalance(profile.hash);
      setBalance(userBalance);

      // Load stats
      const stats = await getStats(profile.hash);
      setTotalProfit(stats.profitMade);
      setTotalWorkouts(stats.workoutLogged);

      // Load games played count
      const { data: games, error } = await supabase
        .from('game_players')
        .select('id', { count: 'exact' })
        .eq('user_hash', profile.hash);

      if (!error && games) {
        setGamesPlayed(games.length);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (amount: number) => {
    if (!userHash) return;
    // The WithdrawModal now handles the Stripe withdrawal directly
    // This callback is just for refreshing the balance after successful withdrawal
    await loadData(); // Reload balance
  };

  const handleSignOut = async () => {
    try {
      // Clear local state first
      setUserHash(undefined);
      setUsername('');
      setEmail('');
      setBalance(0);
      
      // Sign out
      await signOut();
      
      // Wait a moment for state to clear
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Force a hard redirect with cache clearing
      if (typeof window !== 'undefined') {
        // Clear all caches
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
        // Hard redirect to home page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even on error
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
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
          title="Profile"
          subtitle="Please login to view your profile"
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
          {/* Profile Picture */}
          <div className="text-center mb-6 mt-2">
            <div className="w-20 h-20 rounded-full bg-white border-4 border-black flex items-center justify-center mx-auto mb-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {userHash ? (
                <Avatar hash={userHash} size={80} />
              ) : (
                <Image
                  src="/noprofile.png"
                  alt="No profile"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              )}
            </div>
            <div className="text-xl font-extrabold text-black mb-1">{username.toUpperCase() || 'USER'}</div>
            <div className="text-xs font-semibold text-gray-600">{email}</div>
          </div>

          {/* Stats - Vertical List */}
          <div className="mb-4 space-y-3">
            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-[10px] font-bold text-gray-600 tracking-wider uppercase mb-1">
                TOTAL PROFIT
              </div>
              <div className="text-2xl font-extrabold text-black">
                ${totalProfit.toFixed(2)}
              </div>
            </div>

            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-[10px] font-bold text-gray-600 tracking-wider uppercase mb-1">
                TOTAL WORKOUTS
              </div>
              <div className="text-2xl font-extrabold text-black">{totalWorkouts}</div>
            </div>

            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-[10px] font-bold text-gray-600 tracking-wider uppercase mb-1">
                GAMES PLAYED
              </div>
              <div className="text-2xl font-extrabold text-black">{gamesPlayed}</div>
            </div>

            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-[10px] font-bold text-gray-600 tracking-wider uppercase mb-1">
                WIN RATE
              </div>
              <div className="text-2xl font-extrabold text-black">
                {gamesPlayed > 0 ? Math.round((totalProfit > 0 ? 1 : 0) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Balance Card - White */}
          <div className="bg-white border-2 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[11px] font-bold text-gray-600 tracking-wider uppercase mb-2">
              ACCOUNT BALANCE
            </div>
            <div className="text-4xl font-extrabold text-black">
              ${balance.toFixed(2)}
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <ActionButton
              text="WITHDRAW FUNDS"
              onClick={() => setWithdrawModalVisible(true)}
            />
            <ActionButton
              text="SIGN OUT"
              primary
              onClick={handleSignOut}
            />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block max-w-md mx-auto">
          {/* Profile Picture */}
          <div className="text-center mb-6 mt-2">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-black flex items-center justify-center mx-auto mb-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {userHash ? (
                <Avatar hash={userHash} size={96} />
              ) : (
                <Image
                  src="/noprofile.png"
                  alt="No profile"
                  width={96}
                  height={96}
                  className="rounded-full"
                />
              )}
            </div>
            <div className="text-2xl font-extrabold text-black mb-1">{username.toUpperCase() || 'USER'}</div>
            <div className="text-sm font-semibold text-gray-600">{email}</div>
          </div>

          {/* Stats - Vertical List */}
          <div className="mb-4 space-y-3">
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-[11px] font-bold text-gray-600 tracking-wider uppercase mb-2">
                TOTAL PROFIT
              </div>
              <div className="text-3xl font-extrabold text-black">
                ${totalProfit.toFixed(2)}
              </div>
            </div>

            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-[11px] font-bold text-gray-600 tracking-wider uppercase mb-2">
                TOTAL WORKOUTS
              </div>
              <div className="text-3xl font-extrabold text-black">{totalWorkouts}</div>
            </div>

            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-[11px] font-bold text-gray-600 tracking-wider uppercase mb-2">
                GAMES PLAYED
              </div>
              <div className="text-3xl font-extrabold text-black">{gamesPlayed}</div>
            </div>

            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-[11px] font-bold text-gray-600 tracking-wider uppercase mb-2">
                WIN RATE
              </div>
              <div className="text-3xl font-extrabold text-black">
                {gamesPlayed > 0 ? Math.round((totalProfit > 0 ? 1 : 0) * 100) : 0}%
              </div>
            </div>
          </div>

          {/* Balance Card - White */}
          <div className="bg-white border-2 border-black p-5 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-[11px] font-bold text-gray-600 tracking-wider uppercase mb-2">
              ACCOUNT BALANCE
            </div>
            <div className="text-4xl font-extrabold text-black">
              ${balance.toFixed(2)}
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <ActionButton
              text="WITHDRAW FUNDS"
              onClick={() => setWithdrawModalVisible(true)}
            />
            <ActionButton
              text="SIGN OUT"
              primary
              onClick={handleSignOut}
            />
          </div>
        </div>
      </div>

      <WithdrawModal
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
        onWithdraw={handleWithdraw}
        maxAmount={balance}
      />
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
      />
    </div>
  );
}

