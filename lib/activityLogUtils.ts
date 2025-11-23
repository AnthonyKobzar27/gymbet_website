import { supabase } from './supabase';

export interface ActivityLog {
  id: number;
  user_hash: string;
  sender_hash: string;
  message: string;
  typeofmessage: string;
  image: string | null;
  timestep: string;
  game_id?: string | null;
}

export async function getActivityFeed(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('timestep', { ascending: false })
    .limit(50);

  if (error) {
    console.error('failed to get activity feed', error);
    return [];
  }

  return data || [];
}

export async function addActivityLog(
  userHash: string,
  senderHash: string,
  message: string,
  typeofmessage: string,
  image?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('activity_log')
    .insert({
      user_hash: userHash,
      sender_hash: senderHash,
      message: message,
      typeofmessage: typeofmessage,
      image: image || null,
    });

  if (error) {
    console.error('failed to add activity log', error);
    return false;
  }

  return true;
}

export async function addActivityLogWithId(
  userHash: string,
  senderHash: string,
  message: string,
  typeofmessage: string,
  image?: string,
  gameId?: string | null
): Promise<{ ok: boolean; id?: number; error?: any }> {
  const { data, error } = await supabase
    .from('activity_log')
    .insert({
      user_hash: userHash,
      sender_hash: senderHash,
      message: message,
      typeofmessage: typeofmessage,
      image: image || null,
      game_id: gameId || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('failed to add activity log', error);
    return { ok: false, error };
  }

  return { ok: true, id: data.id };
}

export async function voteOnProof(
  activityLogId: number,
  voterHash: string,
  voteType: 'approve' | 'reject'
): Promise<{ ok: boolean; error?: any }> {
  const { error } = await supabase
    .from('proof_votes')
    .upsert(
      {
        activity_log_id: activityLogId,
        voter_hash: voterHash,
        vote_type: voteType,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'activity_log_id,voter_hash',
      }
    );

  if (error) {
    console.error('Failed to vote on proof:', error);
    return { ok: false, error };
  }

  return { ok: true };
}

export async function removeVote(
  activityLogId: number,
  voterHash: string
): Promise<{ ok: boolean; error?: any }> {
  const { error } = await supabase
    .from('proof_votes')
    .delete()
    .eq('activity_log_id', activityLogId)
    .eq('voter_hash', voterHash);

  if (error) {
    console.error('Failed to remove vote:', error);
    return { ok: false, error };
  }

  return { ok: true };
}

export async function getVoteCounts(
  activityLogIds: number[]
): Promise<Map<number, { approvals: number; rejections: number }>> {
  const { data, error } = await supabase
    .from('proof_votes')
    .select('activity_log_id, vote_type')
    .in('activity_log_id', activityLogIds);

  if (error) {
    console.error('Failed to get vote counts:', error);
    return new Map();
  }

  const counts = new Map<number, { approvals: number; rejections: number }>();

  data?.forEach((vote) => {
    const current = counts.get(vote.activity_log_id) || { approvals: 0, rejections: 0 };
    if (vote.vote_type === 'approve') {
      current.approvals++;
    } else if (vote.vote_type === 'reject') {
      current.rejections++;
    }
    counts.set(vote.activity_log_id, current);
  });

  return counts;
}

export async function getUserVotes(
  activityLogIds: number[],
  voterHash: string
): Promise<Map<number, 'approve' | 'reject'>> {
  const { data, error } = await supabase
    .from('proof_votes')
    .select('activity_log_id, vote_type')
    .in('activity_log_id', activityLogIds)
    .eq('voter_hash', voterHash);

  if (error) {
    console.error('Failed to get user votes:', error);
    return new Map();
  }

  const votes = new Map<number, 'approve' | 'reject'>();
  data?.forEach((vote) => {
    votes.set(vote.activity_log_id, vote.vote_type as 'approve' | 'reject');
  });

  return votes;
}


