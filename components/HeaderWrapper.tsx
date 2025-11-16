'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from './Header';

export default function HeaderWrapper() {
  const { user, getUserProfile } = useAuth();
  const [profile, setProfile] = useState<{ hash: string; balance: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      if (user) {
        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile({ hash: userProfile.hash, balance: userProfile.balance });
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    };
    loadProfile();
  }, [user, getUserProfile]);

  // Reload balance periodically when user is logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const userProfile = await getUserProfile();
      if (userProfile) {
        setProfile({ hash: userProfile.hash, balance: userProfile.balance });
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [user, getUserProfile]);

  if (loading) {
    return (
      <Header
        user={null}
        balance={0}
        userHash={undefined}
      />
    );
  }

  return (
    <Header
      user={user ? { id: user.id, email: user.email || '' } : null}
      balance={profile?.balance ?? 0}
      userHash={profile?.hash}
    />
  );
}

