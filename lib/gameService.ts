import { supabase } from './supabase';
import { getBalance } from './transactionUtils';
import { addActivityLog } from './activityLogUtils';

export interface WeeklySchedule {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface Game {
  id: string;
  split_type: string;
  weekly_schedule?: WeeklySchedule;
  stake: number;
  status: 'joinable' | 'active' | 'completed';
  player_count: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_hash: string;
  joined_at: string;
  status: 'active' | 'eliminated' | 'winner';
  total_workouts: number;
  last_submission_date: string | null;
}

export interface GameLog {
  id: string;
  game_id: string;
  user_hash: string | null;
  message: string;
  event_type: 'join' | 'workout' | 'elimination' | 'win' | 'missed_workout' | 'game_start' | 'game_end' | 'chat' | 'proof';
  created_at: string;
  photo_url?: string | null;
}

export interface GameWithPlayers extends Game {
  players: GamePlayer[];
  logs: GameLog[];
}

function parseWeeklySchedule(splitType: string): WeeklySchedule {
  try {
    return JSON.parse(splitType);
  } catch (e) {
    return {
      monday: splitType,
      tuesday: splitType,
      wednesday: splitType,
      thursday: splitType,
      friday: splitType,
      saturday: splitType,
      sunday: splitType,
    };
  }
}

export async function getJoinableGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'joinable')
    .lt('player_count', 8)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get joinable games:', error);
    return [];
  }

  const games = (data as Game[]) || [];
  games.forEach(game => {
    game.weekly_schedule = parseWeeklySchedule(game.split_type);
  });

  return games;
}

export async function getUserActiveGame(userHash: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('game_players')
    .select('game_id, games(*)')
    .eq('user_hash', userHash)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const game = (data as any).games as Game;
  if (game && (game.status === 'active' || game.status === 'joinable')) {
    game.weekly_schedule = parseWeeklySchedule(game.split_type);
    return game;
  }

  return null;
}

export async function getGameDetails(gameId: string): Promise<GameWithPlayers | null> {
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    console.error('Failed to get game:', gameError);
    return null;
  }

  const parsedGame = game as Game;
  parsedGame.weekly_schedule = parseWeeklySchedule(parsedGame.split_type);

  const { data: players, error: playersError } = await supabase
    .from('game_players')
    .select('*')
    .eq('game_id', gameId)
    .order('joined_at', { ascending: true });

  if (playersError) {
    console.error('Failed to get game players:', playersError);
    return null;
  }

  const { data: logs, error: logsError } = await supabase
    .from('game_logs')
    .select('*')
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (logsError) {
    console.error('Failed to get game logs:', logsError);
    return null;
  }

  return {
    ...parsedGame,
    players: (players as GamePlayer[]) || [],
    logs: (logs as GameLog[]) || [],
  } as GameWithPlayers;
}

export async function createGame(
  weeklySchedule: WeeklySchedule,
  stake: number
): Promise<{ ok: boolean; game?: Game; error?: any }> {
  if (!stake || typeof stake !== 'number' || !isFinite(stake)) {
    return { ok: false, error: { message: 'Invalid stake amount' } };
  }

  if (stake < 0.50) {
    return { ok: false, error: { message: 'Minimum stake is $0.50' } };
  }

  if (stake > 100) {
    return { ok: false, error: { message: 'Maximum stake is $100' } };
  }

  const roundedStake = Math.round(stake * 100) / 100;

  const { data, error } = await supabase
    .from('games')
    .insert({
      split_type: JSON.stringify(weeklySchedule),
      stake: roundedStake,
      status: 'joinable',
      player_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create game:', error);
    return { ok: false, error };
  }

  const game = data as Game;
  game.weekly_schedule = parseWeeklySchedule(game.split_type);

  return { ok: true, game };
}

export async function joinGame(
  gameId: string,
  userHash: string
): Promise<{ ok: boolean; error?: any }> {
  const { data: existingPlayer } = await supabase
    .from('game_players')
    .select('id')
    .eq('game_id', gameId)
    .eq('user_hash', userHash)
    .maybeSingle();

  if (existingPlayer) {
    return { ok: false, error: { message: 'Already in this game' } };
  }

  const { data: game } = await supabase
    .from('games')
    .select('player_count, status, stake')
    .eq('id', gameId)
    .single();

  if (!game) {
    return { ok: false, error: { message: 'Game not found' } };
  }

  if (game.status !== 'joinable') {
    return { ok: false, error: { message: 'Game is not joinable' } };
  }

  if (game.player_count >= 8) {
    return { ok: false, error: { message: 'Game is full' } };
  }

  const userBalance = await getBalance(userHash);

  if (userBalance < game.stake) {
    return { ok: false, error: { message: `Insufficient balance. Need $${game.stake.toFixed(2)}, but you have $${userBalance.toFixed(2)}` } };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('hash', userHash)
    .single();

  if (profileError || !profile?.user_id) {
    console.error('Failed to get user_id:', profileError);
    return { ok: false, error: { message: 'Failed to get user profile' } };
  }

  // Deduct stake using RPC function
  const { data: updateResult, error: updateError } = await supabase
    .rpc('update_balance_atomic', {
      p_user_id: profile.user_id,
      p_user_hash: userHash,
      p_delta: -game.stake,
      p_transaction_type: 'stake',
      p_description: `Staked $${game.stake.toFixed(2)} for game ${gameId}`
    });

  if (updateError || !updateResult?.success) {
    console.error('Failed to deduct stake:', updateError || updateResult?.error);
    return { ok: false, error: { message: 'Failed to process stake payment' } };
  }

  const { error: insertError } = await supabase
    .from('game_players')
    .insert({
      game_id: gameId,
      user_hash: userHash,
      status: 'active',
      total_workouts: 0,
    });

  if (insertError) {
    console.error('Failed to join game:', insertError);
    return { ok: false, error: insertError };
  }

  const newPlayerCount = game.player_count + 1;
  const newStatus = newPlayerCount === 8 ? 'active' : 'joinable';
  const updateData: any = {
    player_count: newPlayerCount,
    status: newStatus,
  };

  if (newStatus === 'active') {
    updateData.started_at = new Date().toISOString();
  }

  const { error: gameUpdateError } = await supabase
    .from('games')
    .update(updateData)
    .eq('id', gameId);

  if (gameUpdateError) {
    console.error('Failed to update game:', gameUpdateError);
    return { ok: false, error: gameUpdateError };
  }

  await addGameLog(
    gameId,
    userHash,
    `Player 0x${userHash.substring(0, 8)} joined the game`,
    'join'
  );

  await addActivityLog(
    userHash,
    userHash,
    `joined a game with $${game.stake.toFixed(2)} stake`,
    'bet'
  );

  return { ok: true };
}

export async function leaveGame(
  gameId: string,
  userHash: string
): Promise<{ ok: boolean; refunded?: number; error?: any }> {
  const { data: game } = await supabase
    .from('games')
    .select('stake, status, player_count')
    .eq('id', gameId)
    .single();

  if (!game) {
    return { ok: false, error: { message: 'Game not found' } };
  }

  if (game.status === 'active') {
    return { ok: false, error: { message: 'Cannot leave an active game' } };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('hash', userHash)
    .single();

  if (!profile?.user_id) {
    return { ok: false, error: { message: 'Failed to get user profile' } };
  }

  const { error: deleteError } = await supabase
    .from('game_players')
    .delete()
    .eq('game_id', gameId)
    .eq('user_hash', userHash);

  if (deleteError) {
    return { ok: false, error: deleteError };
  }

  // Refund stake
  const { data: refundResult } = await supabase
    .rpc('update_balance_atomic', {
      p_user_id: profile.user_id,
      p_user_hash: userHash,
      p_delta: game.stake,
      p_transaction_type: 'deposit',
      p_description: `Refund: Left game ${gameId}`
    });

  if (!refundResult?.success) {
    console.error('Failed to refund stake:', refundResult?.error);
  }

  const newPlayerCount = Math.max(0, game.player_count - 1);
  await supabase
    .from('games')
    .update({ player_count: newPlayerCount })
    .eq('id', gameId);

  await addGameLog(
    gameId,
    userHash,
    `Player 0x${userHash.substring(0, 8)} left the game`,
    'leave'
  );

  return { ok: true, refunded: game.stake };
}

export async function submitProof(
  gameId: string,
  userHash: string,
  photoFile: File,
  caption: string
): Promise<{ ok: boolean; isOnTime?: boolean; error?: any }> {
  const submissionDate = new Date().toISOString().split('T')[0];
  const fileName = `${gameId}/${userHash}/${submissionDate}-${Date.now()}.jpg`;

  const arrayBuffer = await photoFile.arrayBuffer();

  if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
    return { ok: false, error: { message: 'Image must be less than 10MB' } };
  }

  const { error: uploadError } = await supabase.storage
    .from('workout-proofs')
    .upload(fileName, arrayBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

  if (uploadError) {
    console.error('Failed to upload photo:', uploadError);
    return { ok: false, error: uploadError };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('workout-proofs')
    .getPublicUrl(fileName);

  const { error: insertError } = await supabase
    .from('game_submissions')
    .insert({
      game_id: gameId,
      user_hash: userHash,
      submission_date: submissionDate,
      photo_url: publicUrl,
      submitted_at: new Date().toISOString(),
      is_on_time: true,
      verified: false,
    });

  if (insertError) {
    console.error('Failed to submit proof:', insertError);
    return { ok: false, error: insertError };
  }

  await addGameLog(
    gameId,
    userHash,
    `0x${userHash.substring(0, 8)} submitted workout proof: ${caption}`,
    'proof'
  );

  return { ok: true, isOnTime: true };
}

export async function sendChatMessage(
  gameId: string,
  userHash: string,
  message: string
): Promise<{ ok: boolean; error?: any }> {
  const { error } = await supabase
    .from('game_logs')
    .insert({
      game_id: gameId,
      user_hash: userHash,
      message: message,
      event_type: 'chat',
    });

  if (error) {
    console.error('Failed to send chat message:', error);
    return { ok: false, error };
  }

  return { ok: true };
}

export async function addGameLog(
  gameId: string,
  userHash: string | null,
  message: string,
  eventType: GameLog['event_type']
): Promise<boolean> {
  const { error } = await supabase
    .from('game_logs')
    .insert({
      game_id: gameId,
      user_hash: userHash,
      message: message,
      event_type: eventType,
    });

  if (error) {
    console.error('Failed to add game log:', error);
    return false;
  }

  return true;
}

