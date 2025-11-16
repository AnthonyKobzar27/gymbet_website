'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = 'info',
  visible,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  const bgColor = {
    success: 'bg-[#4CAF50]',
    error: 'bg-[#FF4444]',
    info: 'bg-black',
  }[type];

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={`${bgColor} border-4 border-black px-6 py-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]`}
      >
        <div className="text-white text-sm font-extrabold tracking-wide">{message}</div>
      </div>
    </div>
  );
}

