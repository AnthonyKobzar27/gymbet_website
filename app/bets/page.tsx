'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateGameModal from '@/components/modals/CreateGameModal';
import ProofSubmissionModal from '@/components/modals/ProofSubmissionModal';
import ActiveGameView from '@/components/bets/ActiveGameView';
import JoinableGamesView from '@/components/bets/JoinableGamesView';
import GuestView from '@/components/GuestView';
import LoginModal from '@/components/modals/LoginModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { getUserActiveGame, getGameDetails, getJoinableGames, joinGame, leaveGame, submitProof, sendChatMessage } from '@/lib/gameService';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function BetsPage() {
  const router = useRouter();
  const { user, loading: authLoading, getUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasActiveGame, setHasActiveGame] = useState(false);
  const [activeGame, setActiveGame] = useState<any>(null);
  const [joinableGames, setJoinableGames] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'players' | 'log'>('players');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
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

      // Check for active game
      const activeGameData = await getUserActiveGame(profile.hash);
      if (activeGameData) {
        const gameDetails = await getGameDetails(activeGameData.id);
        setHasActiveGame(true);
        setActiveGame(gameDetails);

        // Check if user has submitted today
        if (gameDetails) {
          const today = new Date().toISOString().split('T')[0];
          const { data: submission } = await supabase
            .from('game_submissions')
            .select('id')
            .eq('game_id', gameDetails.id)
            .eq('user_hash', profile.hash)
            .eq('submission_date', today)
            .maybeSingle();
          
          setHasSubmittedToday(!!submission);
        }
      } else {
        setHasActiveGame(false);
        setActiveGame(null);
      }

      // Load joinable games
      const games = await getJoinableGames();
      setJoinableGames(games);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (!userHash) return;

    try {
      const result = await joinGame(gameId, userHash);
      if (result.ok) {
        await loadData(); // Reload to show active game
      } else {
        alert(result.error?.message || 'Failed to join game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      alert('Failed to join game');
    }
  };

  const handleCreateGame = () => {
    setCreateModalVisible(true);
  };

  const handleGameCreated = async () => {
    setCreateModalVisible(false);
    await loadData(); // Reload to show the new game
  };

  const handleSubmitProof = async (photoFile: File, caption: string) => {
    if (!activeGame || !userHash) return;

    try {
      const result = await submitProof(activeGame.id, userHash, photoFile, caption);
      if (result.ok) {
        setProofModalVisible(false);
        setHasSubmittedToday(true);
        await loadData(); // Reload game data
      } else {
        alert(result.error?.message || 'Failed to submit proof');
      }
    } catch (error) {
      console.error('Error submitting proof:', error);
      alert('Failed to submit proof');
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !activeGame || !userHash) return;
    
    setSendingMessage(true);
    try {
      const result = await sendChatMessage(activeGame.id, userHash, chatMessage);
      if (result.ok) {
        setChatMessage('');
        await loadData(); // Reload to show new message
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!activeGame || !userHash) return;
    
    if (confirm('Are you sure you want to leave? You will get your stake refunded.')) {
      try {
        const result = await leaveGame(activeGame.id, userHash);
        if (result.ok) {
          await loadData(); // Reload to show joinable games
        } else {
          alert(result.error?.message || 'Failed to leave game');
        }
      } catch (error) {
        console.error('Error leaving game:', error);
        alert('Failed to leave game');
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
          title="Bets"
          subtitle="Please login to view and join games"
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
          {hasActiveGame ? (
            <ActiveGameView
              activeGame={activeGame}
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
              hasSubmittedToday={hasSubmittedToday}
              onSubmitProof={() => setProofModalVisible(true)}
              onLeaveGame={handleLeaveGame}
              chatMessage={chatMessage}
              onChatMessageChange={setChatMessage}
              onSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
              formatDate={formatDate}
            />
          ) : (
            <JoinableGamesView
              joinableGames={joinableGames}
              onJoinGame={handleJoinGame}
              onCreateGame={handleCreateGame}
              formatDate={formatDate}
            />
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block max-w-6xl mx-auto">
          {hasActiveGame ? (
            <ActiveGameView
              activeGame={activeGame}
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
              hasSubmittedToday={hasSubmittedToday}
              onSubmitProof={() => setProofModalVisible(true)}
              onLeaveGame={handleLeaveGame}
              chatMessage={chatMessage}
              onChatMessageChange={setChatMessage}
              onSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
              formatDate={formatDate}
            />
          ) : (
            <JoinableGamesView
              joinableGames={joinableGames}
              onJoinGame={handleJoinGame}
              onCreateGame={handleCreateGame}
              formatDate={formatDate}
            />
          )}
        </div>
      </div>

      <CreateGameModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onGameCreated={handleGameCreated}
      />

      <ProofSubmissionModal
        visible={proofModalVisible}
        onClose={() => setProofModalVisible(false)}
        onSubmit={handleSubmitProof}
        gameId="1"
        splitType="Push"
      />
    </div>
  );
}

