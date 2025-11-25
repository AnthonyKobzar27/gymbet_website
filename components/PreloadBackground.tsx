'use client';

import { useEffect } from 'react';

export default function PreloadBackground() {
  useEffect(() => {
    // Preload the background image
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = '/AppBackground.jpg';
    link.fetchPriority = 'high';
    document.head.appendChild(link);

    // Also preload using Image object to ensure it's cached
    const img = new Image();
    img.src = '/AppBackground.jpg';

    return () => {
      // Cleanup
      const existingLink = document.querySelector('link[href="/AppBackground.jpg"]');
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  return null;
}




