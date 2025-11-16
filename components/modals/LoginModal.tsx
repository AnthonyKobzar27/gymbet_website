'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LoginModal({ visible, onClose }: LoginModalProps) {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleAuth = async () => {
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isLogin && !username) {
      setError('Please enter a username');
      return;
    }

    if (!isLogin && username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, username);
      }

      if (result.error) {
        setError(result.error.message || 'Authentication failed');
      } else {
        // Success - close modal and reload page
        handleClose();
        window.location.reload();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
      <div className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 border-2 border-black flex items-center justify-center"
        >
          <div className="text-base font-extrabold text-black">✕</div>
        </button>

        <div className="text-3xl font-extrabold text-black text-center mb-2 mt-4">
          {isLogin ? 'Welcome Back!' : 'Join GymBet'}
        </div>
        <div className="text-sm font-semibold text-gray-600 text-center mb-8 leading-5">
          {isLogin
            ? 'Sign in to continue your discipline journey'
            : 'Start betting on your discipline goals'}
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-100 border-2 border-red-500">
            <div className="text-sm font-bold text-red-700">{error}</div>
          </div>
        )}

        {!isLogin && (
          <div className="mb-5">
            <div className="text-sm font-bold text-black mb-2">Username</div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full border-[3px] border-black bg-white px-4 py-3 text-base font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black"
              disabled={loading}
            />
          </div>
        )}

        <div className="mb-5">
          <div className="text-sm font-bold text-black mb-2">Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full border-[3px] border-black bg-white px-4 py-3 text-base font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black"
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <div className="text-sm font-bold text-black mb-2">Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full border-[3px] border-black bg-white px-4 py-3 text-base font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleAuth}
          disabled={loading}
          className={`w-full bg-black border-4 border-black py-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
            loading ? 'opacity-60' : ''
          }`}
        >
          {loading ? (
            <div className="text-white text-base font-extrabold tracking-wide">Loading...</div>
          ) : (
            <div className="text-white text-base font-extrabold tracking-wide text-center">
              {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </div>
          )}
        </button>

        <button
          onClick={toggleMode}
          disabled={loading}
          className="w-full py-3 mb-2"
        >
          <div className="text-sm font-semibold text-black text-center">
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </div>
        </button>

        {isLogin && (
          <button disabled={loading} className="w-full py-2">
            <div className="text-xs font-semibold text-gray-600 text-center">
              Forgot Password?
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

