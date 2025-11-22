'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'HOME' },
  { href: '/bets', label: 'BETS' },
  { href: '/profile', label: 'PROFILE' },
];

export default function SwipeNavigation({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const minSwipeDistance = 50; // Minimum distance in pixels to trigger a swipe
  const maxVerticalDistance = 30; // Maximum vertical movement to consider it a horizontal swipe

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!isMobile || !touchStartX.current || !touchEndX.current || !touchStartY.current || !touchEndY.current) {
      return;
    }

    const horizontalDistance = touchStartX.current - touchEndX.current;
    const verticalDistance = Math.abs(touchStartY.current - (touchEndY.current || touchStartY.current));
    
    // Only trigger swipe if horizontal movement is greater than vertical (horizontal swipe)
    if (verticalDistance > maxVerticalDistance) {
      // Reset if it's primarily a vertical scroll
      touchStartX.current = null;
      touchEndX.current = null;
      touchStartY.current = null;
      touchEndY.current = null;
      return;
    }

    const isLeftSwipe = horizontalDistance > minSwipeDistance;
    const isRightSwipe = horizontalDistance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = tabs.findIndex(tab => tab.href === pathname);
      
      if (currentIndex === -1) return; // Current path not in tabs

      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        // Swipe left: go to next tab
        router.push(tabs[currentIndex + 1].href);
      } else if (isRightSwipe && currentIndex > 0) {
        // Swipe right: go to previous tab
        router.push(tabs[currentIndex - 1].href);
      }
    }

    // Reset touch positions
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  // On desktop, just render children without wrapper
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

