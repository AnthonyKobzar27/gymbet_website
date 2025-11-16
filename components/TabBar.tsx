'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TabBar() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: 'HOME' },
    { href: '/bets', label: 'BETS' },
    { href: '/profile', label: 'PROFILE' },
  ];

  return (
    <>
      {/* Mobile Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0b0930] border-t-0 h-[70px] z-40">
        <div className="flex items-center justify-around h-full">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? 'text-white' : 'text-white opacity-70'
                }`}
              >
                <div className="text-sm font-extrabold tracking-wide">{tab.label}</div>
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );
}

