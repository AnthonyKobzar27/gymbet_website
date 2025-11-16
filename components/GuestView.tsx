'use client';

import ActionButton from './ActionButton';

interface GuestViewProps {
  title: string;
  subtitle: string;
  onLoginPress: () => void;
}

export default function GuestView({ title, subtitle, onLoginPress }: GuestViewProps) {
  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: 'url(/AppBackground.jpg)',
        }}
      />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-5 py-10">
        <div className="w-full max-w-md text-center">
          <div className="text-3xl font-extrabold text-black mb-4">{title}</div>
          <div className="text-base font-semibold text-gray-600 mb-8 leading-6">
            {subtitle}
          </div>
          <ActionButton text="LOGIN" primary onClick={onLoginPress} />
        </div>
      </div>
    </div>
  );
}

