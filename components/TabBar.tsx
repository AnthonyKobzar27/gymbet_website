'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TabBar() {
  const pathname = usePathname();

  const tabs = [
    { href: '/', label: 'HOME', icon: '🏠' },
    { href: '/bets', label: 'BETS', icon: '🏆' },
    { href: '/profile', label: 'PROFILE', icon: '👤' },
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
                <div className="text-2xl mb-1">{tab.icon}</div>
                <div className="text-xs font-bold">{tab.label}</div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-[73px] bottom-0 w-20 bg-[#0b0930] border-r-4 border-black z-30 flex-col items-center py-6">
        <div className="flex flex-col items-center gap-8">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-white opacity-70 hover:opacity-100'
                }`}
                title={tab.label}
              >
                <div className="text-3xl mb-1">{tab.icon}</div>
                <div className="text-[10px] font-bold">{tab.label}</div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

