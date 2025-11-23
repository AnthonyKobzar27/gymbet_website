'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DepositModal from './DepositModal';
import LoginModal from './modals/LoginModal';
import Avatar from './Avatar';

interface HeaderProps {
  user?: { id: string; email: string } | null;
  balance?: number;
  userHash?: string;
}

export default function Header({ user, balance = 0, userHash }: HeaderProps) {
  const pathname = usePathname();
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'HOME' },
    { href: '/bets', label: 'BETS' },
    { href: '/profile', label: 'PROFILE' },
  ];

  const handleConnect = () => {
    if (!user) {
      setLoginModalVisible(true);
      return;
    }
    setDepositModalVisible(true);
  };

  return (
    <>
      <header className={`sticky top-0 z-50 relative transition-all duration-300 ${
        isMobile && isScrolled ? 'bg-[#f7def1]' : 'bg-transparent'
      }`}>
        {/* Mobile Collapsed Header - Light Bar */}
        {isMobile && isScrolled ? (
          <div className="lg:hidden flex items-center justify-between px-3 py-1.5 border-b-2 border-black">
            <div className="text-sm font-extrabold text-black">GYMBET</div>
            <div className="flex items-center gap-1.5">
              {user && (
                <div className="bg-black border-2 border-black px-1.5 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="text-white text-[10px] font-bold tracking-wide text-center">
                    ${balance.toFixed(2)}
                  </div>
                </div>
              )}
              <Link
                href="/profile"
                className="w-6 h-6 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-[0px_2px_4px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                {user && userHash ? (
                  <Avatar hash={userHash} size={24} />
                ) : (
                  <Image
                    src="/noprofile.png"
                    alt="No profile"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex items-center justify-between px-5 py-4 lg:px-8 lg:py-5">
              {/* Left Side - Logo and Navigation */}
              <div className="flex items-center gap-4 lg:gap-6">
                {/* Logo/Title */}
                <div className="text-2xl lg:text-3xl font-extrabold text-black">
                  GYMBET
                </div>

                {/* Navigation Links - Desktop Only */}
                <nav className="hidden md:flex items-center gap-4 lg:gap-6">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`text-sm lg:text-base font-extrabold tracking-wide transition-colors ${
                          isActive ? 'text-black' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-3 lg:gap-4">
                {user && (
                  <div className="bg-black border-2 border-black px-3 py-2 lg:px-4 lg:py-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-white text-sm lg:text-base font-bold tracking-wide text-center">
                      ${balance.toFixed(2)}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleConnect}
                  className="bg-white border-2 border-black px-4 py-2.5 lg:px-5 lg:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="text-black text-sm lg:text-base font-bold tracking-wide text-center">
                    {user ? 'Deposit' : 'Login'}
                  </div>
                </button>

                <Link
                  href="/profile"
                  className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-[0px_2px_4px_rgba(0,0,0,0.3)] overflow-hidden"
                >
                  {user && userHash ? (
                    <Avatar hash={userHash} size={48} />
                  ) : (
                    <Image
                      src="/noprofile.png"
                      alt="No profile"
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                  )}
                </Link>
              </div>
            </div>
            
            {/* Mobile Tabs - Only visible on mobile when not scrolled */}
            <nav className="lg:hidden">
              <div className="flex items-center justify-around px-5 py-3">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`text-sm font-extrabold tracking-wide ${
                        isActive ? 'text-black' : 'text-gray-500'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </>
        )}
      </header>

      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
      />

      {user && (
        <DepositModal
          visible={depositModalVisible}
          onClose={() => setDepositModalVisible(false)}
          onDeposit={() => {
            // Balance will be updated via webhook after Stripe payment
            setDepositModalVisible(false);
          }}
        />
      )}
    </>
  );
}

