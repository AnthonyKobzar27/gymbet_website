'use client';

import ActionButton from './ActionButton';
import BackgroundImage from './BackgroundImage';

interface GuestViewProps {
  title: string;
  subtitle: string;
  onLoginPress: () => void;
}

export default function GuestView({ title, subtitle, onLoginPress }: GuestViewProps) {
  return (
    <div className="min-h-screen relative">
      <BackgroundImage />
      <div className="relative z-10 flex items-center justify-center min-h-screen px-5 py-10 lg:py-10 -mt-[100px] lg:mt-0">
        <div className="w-full max-w-md">
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="text-2xl font-extrabold text-black mb-4 whitespace-nowrap">{title}</div>
            <div className="text-base font-semibold text-gray-600 mb-8 leading-6">
              {subtitle}
            </div>
            <ActionButton text="LOGIN" primary onClick={onLoginPress} />
          </div>
        </div>
      </div>
    </div>
  );
}


