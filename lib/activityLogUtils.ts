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
  validation_status?: 'pending' | 'approved' | 'rejected';
  total_validators?: number;
  required_approvals?: number;
}

// Get all activity logs (for "All" view)
export async function getAllActivityLogs(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('timestep', { ascending: false })
    .limit(50);

  if (error) {
    console.error('failed to get all activity logs', error);
    return [];
  }

  return data || [];
}

// Get only proofs for voting (filtered to show only proof type with images)
export async function getActivityFeed(): Promise<ActivityLog[]> {
  // First, get ALL activity logs to see what we have
  const { data: allData, error: allError } = await supabase
    .from('activity_log')
    .select('*')
    .order('timestep', { ascending: false })
    .limit(200); // Get more to see what's there

  if (allError) {
    console.error('failed to get all activity logs', allError);
    return [];
  }

  console.log(`[ActivityFeed] Total activity logs in DB: ${allData?.length || 0}`);
  
  // Filter for proofs: (typeofmessage = 'proof' OR 'workout') AND has image
  // Note: Proofs are stored with typeofmessage='workout' when submitted via submitProof
  const proofData = (allData || []).filter(log => {
    const isProofType = log.typeofmessage === 'proof' || log.typeofmessage === 'workout';
    const hasImage = log.image && log.image.trim() !== '';
    return isProofType && hasImage;
  });

  console.log(`[ActivityFeed] Filtered to ${proofData.length} proofs ((typeofmessage='proof' OR 'workout') AND has image)`);
  
  // Log what we're filtering out
  const nonProofs = (allData || []).filter(log => log.typeofmessage !== 'proof' && log.typeofmessage !== 'workout');
  const proofsWithoutImage = (allData || []).filter(log => 
    (log.typeofmessage === 'proof' || log.typeofmessage === 'workout') && 
    (!log.image || log.image.trim() === '')
  );
  
  if (nonProofs.length > 0) {
    console.log(`[ActivityFeed] Found ${nonProofs.length} logs with typeofmessage != 'proof'/'workout'`);
    const types = [...new Set(nonProofs.map(l => l.typeofmessage))];
    console.log(`[ActivityFeed] Other types found:`, types);
  }
  
  if (proofsWithoutImage.length > 0) {
    console.log(`[ActivityFeed] Found ${proofsWithoutImage.length} workout/proof logs without images (filtered out)`);
  }

  // Process ALL proofs to check 48-hour window and update validation status
  // This ensures all proofs get their status updated when feed is loaded
  const processedLogs = await Promise.all(
    (proofData || []).map(async (log) => {
      const proofAge = (new Date().getTime() - new Date(log.timestep).getTime()) / (1000 * 60 * 60);
      console.log(`[ActivityFeed] Proof ${log.id}: age=${proofAge.toFixed(2)}h, current_status=${log.validation_status || 'null'}`);
      
      const updatedLog = await checkAndUpdateValidationStatus(log);
      
      if (updatedLog.validation_status !== log.validation_status) {
        console.log(`[ActivityFeed] Proof ${log.id}: status changed from ${log.validation_status} to ${updatedLog.validation_status}`);
      }
      
      return updatedLog;
    })
  );

  const pendingCount = processedLogs.filter(l => l.validation_status === 'pending').length;
  const approvedCount = processedLogs.filter(l => l.validation_status === 'approved').length;
  const rejectedCount = processedLogs.filter(l => l.validation_status === 'rejected').length;
  
  console.log(`[ActivityFeed] Status summary: ${pendingCount} pending, ${approvedCount} approved, ${rejectedCount} rejected`);

  return processedLogs;
}

// Check if proof is within 48-hour voting window
export function isWithin48Hours(timestep: string): boolean {
  const proofTime = new Date(timestep).getTime();
  const now = new Date().getTime();
  const hoursElapsed = (now - proofTime) / (1000 * 60 * 60);
  return hoursElapsed < 48;
}

// Calculate time remaining in 48-hour window
export function getTimeRemaining(timestep: string): { hours: number; minutes: number; seconds: number } | null {
  const proofTime = new Date(timestep).getTime();
  const now = new Date().getTime();
  const hoursElapsed = (now - proofTime) / (1000 * 60 * 60);
  
  if (hoursElapsed >= 48) {
    return null; // Time expired
  }

  const totalSecondsRemaining = Math.max(0, (48 * 60 * 60) - ((now - proofTime) / 1000));
  const hours = Math.floor(totalSecondsRemaining / 3600);
  const minutes = Math.floor((totalSecondsRemaining % 3600) / 60);
  const seconds = Math.floor(totalSecondsRemaining % 60);

  return { hours, minutes, seconds };
}

// Check and update validation status based on 48-hour window and votes
async function checkAndUpdateValidationStatus(log: ActivityLog): Promise<ActivityLog> {
  const isWithinWindow = isWithin48Hours(log.timestep);
  
  // If within 48 hours, status should ALWAYS be pending (yellow border)
  // This overrides any existing status (approved/rejected) if still within voting window
  if (isWithinWindow) {
    if (log.validation_status !== 'pending') {
      // Force update to pending if it was set to something else (e.g., if DB had wrong status)
      await supabase
        .from('activity_log')
        .update({ validation_status: 'pending' })
        .eq('id', log.id);
    }
    return { ...log, validation_status: 'pending' };
  }

  // After 48 hours, determine status based on votes
  // Only update if status hasn't been finalized yet (is still pending)
  const currentStatus = log.validation_status || 'pending';
  if (currentStatus !== 'pending') {
    // Status already finalized (approved/rejected), don't change it
    return log;
  }

  const { data: votes, error: votesError } = await supabase
    .from('proof_votes')
    .select('vote_type')
    .eq('activity_log_id', log.id);

  if (votesError) {
    console.error('Error fetching votes for proof:', log.id, votesError);
    return log;
  }

  const approvals = votes?.filter(v => v.vote_type === 'approve').length || 0;
  const rejections = votes?.filter(v => v.vote_type === 'reject').length || 0;
  const totalVotes = approvals + rejections;
  
  // Get PBFT consensus parameters from the log
  const totalValidators = log.total_validators || 0;
  const requiredApprovals = log.required_approvals || 0;

  let newStatus: 'pending' | 'approved' | 'rejected' = 'pending';

  // After 48 hours, determine status based on PBFT consensus logic
  const MIN_VOTES_FOR_DECISION = 10;

  if (totalVotes < MIN_VOTES_FOR_DECISION) {
    // Case A: Less than 10 votes - keep pending, wait for 10th vote
    // Don't make a decision until we have at least 10 votes
    newStatus = 'pending';
  } else if (approvals >= requiredApprovals) {
    // Case B: 2/3 majority approval reached (with 10+ votes)
    // Example: 10 validators, required = 7, if approvals >= 7 → approved
    newStatus = 'approved';
  } else if (rejections > (totalValidators - requiredApprovals)) {
    // Case C: Rejection threshold exceeded (with 10+ votes)
    // If rejections exceed what's needed to block 2/3, it's rejected
    // Example: 10 validators, required = 7, so rejections > 3 = rejected
    newStatus = 'rejected';
  } else {
    // Case D: Pending - waiting for more votes
    // totalVotes >= 10 BUT approvals < required AND rejections <= threshold
    // Need more votes to reach consensus
    newStatus = 'pending';
  }

  // Update database if status changed
  if (newStatus !== log.validation_status) {
    const { error: updateError } = await supabase
      .from('activity_log')
      .update({ validation_status: newStatus })
      .eq('id', log.id);
    
    if (updateError) {
      console.error('Error updating validation status:', updateError);
    }
  }

  return { ...log, validation_status: newStatus };
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

export async function getProofsForValidator(validatorHash: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('proof_distribution')
    .select(`
      activity_log_id,
      activity_log (*)
    `)
    .eq('validator_hash', validatorHash)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get proofs for validator:', error);
    return await getFallbackProofs(validatorHash);
  }

  if (!data || data.length === 0) {
    return await getFallbackProofs(validatorHash);
  }

  const activityLogs = data
    .filter(d => d.activity_log)
    .map(d => d.activity_log as any as ActivityLog);

  return activityLogs;
}

async function getFallbackProofs(validatorHash: string): Promise<ActivityLog[]> { 
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('typeofmessage', 'workout')
    .neq('user_hash', validatorHash)
    .order('timestep', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to get fallback proofs:', error);
    return [];
  }

  return data || [];
}

export async function getProofsWithValidators(proofIds: number[]): Promise<Set<number>> {
  if (proofIds.length === 0) {
    return new Set();
  }

  const { data, error } = await supabase
    .from('proof_distribution')
    .select('activity_log_id')
    .in('activity_log_id', proofIds);

  if (error) {
    console.error('Failed to get proofs with validators:', error);
    return new Set();
  }

  if (!data || data.length === 0) {
    return new Set();
  }

  return new Set(data.map(d => d.activity_log_id));
}

export async function checkPBFTValidation(activityLogId: number): Promise<{
  ok: boolean;
  status: 'pending' | 'approved' | 'rejected';
  approvals: number;
  rejections: number;
  required: number;
}> {
  const { data: activityLog, error: logError } = await supabase
    .from('activity_log')
    .select('total_validators, required_approvals, validation_status')
    .eq('id', activityLogId)
    .single();

  if (logError || !activityLog) {
    console.error('Failed to get activity log:', logError);
    return { ok: false, status: 'pending', approvals: 0, rejections: 0, required: 0 };
  }

  const { data: votes, error: votesError } = await supabase
    .from('proof_votes')
    .select('vote_type')
    .eq('activity_log_id', activityLogId);

  if (votesError) {
    console.error('Failed to get votes:', votesError);
    return { ok: false, status: 'pending', approvals: 0, rejections: 0, required: 0 };
  }

  const approvals = votes?.filter(v => v.vote_type === 'approve').length || 0;
  const rejections = votes?.filter(v => v.vote_type === 'reject').length || 0;
  const required = activityLog.required_approvals || 0;
  const totalVotes = approvals + rejections;

  let newStatus: 'pending' | 'approved' | 'rejected' = activityLog.validation_status || 'pending';

  const MIN_VOTES_FOR_DECISION = 10;

  // CRITICAL: Match frontend logic - proofs need at least 10 votes to reach consensus
  // If < 10 votes, stay PENDING (do NOT auto-approve)
  if (totalVotes < MIN_VOTES_FOR_DECISION) {
    newStatus = 'pending'; // Stay pending if < 10 votes (matches frontend)
  } else if (approvals >= required) {
    newStatus = 'approved';
  } else if (rejections > (activityLog.total_validators || 0) - required) {
    newStatus = 'rejected';
  } else {
    newStatus = 'pending';
  }

  if (newStatus !== activityLog.validation_status) {
    const { error: updateError } = await supabase
      .from('activity_log')
      .update({ validation_status: newStatus })
      .eq('id', activityLogId);

    if (updateError) {
      console.error(`❌ Failed to update proof ${activityLogId} status from '${activityLog.validation_status}' to '${newStatus}':`, updateError);
      return { ok: false, status: activityLog.validation_status || 'pending', approvals, rejections, required };
    }

    console.log(`✅ Successfully updated proof ${activityLogId} status from '${activityLog.validation_status}' to '${newStatus}' (${approvals} approvals, ${rejections} rejections, required: ${required})`);
  }

  return {
    ok: true,
    status: newStatus,
    approvals,
    rejections,
    required,
  };
}


