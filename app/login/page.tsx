'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ActionButton from '@/components/ActionButton';
import LoginModal from '@/components/modals/LoginModal';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user) {
      router.push('/');
    } else {
      // Show login modal
      setLoginModalVisible(true);
    }
  }, [user, router]);

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: 'url(/AppBackground.jpg)',
        }}
      />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-5 py-10">
        <div className="w-full max-w-md">
          <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 mb-4 text-center">
            <div className="text-2xl font-extrabold tracking-wide mb-3">
              Welcome to GymBet!
            </div>
            <div className="text-base font-semibold text-gray-600 leading-6 mb-6">
              Join the discipline challenge community. Bet on your goals and win rewards!
            </div>
            <ActionButton
              text="LOG IN / SIGN UP"
              primary
              onClick={() => setLoginModalVisible(true)}
            />
          </div>
        </div>
      </div>

      <LoginModal
        visible={loginModalVisible}
        onClose={() => {
          setLoginModalVisible(false);
          if (user) {
            router.push('/');
          }
        }}
      />
    </div>
  );
}
