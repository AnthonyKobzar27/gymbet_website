'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import makeBlockie from 'ethereum-blockies-base64';

interface AvatarProps {
  hash?: string;
  size?: number;
  className?: string;
}

export default function Avatar({ hash, size = 40, className = '' }: AvatarProps) {
  // Generate blockie using the exact same library as React Native app
  const blockieDataUri = useMemo(() => {
    if (!hash) return null;
    
    try {
      // Use the exact same call as the React Native app
      const dataUri = makeBlockie(hash.toLowerCase());
      return dataUri || null;
    } catch (error) {
      console.error('Error generating blockie:', error, hash);
      return null;
    }
  }, [hash]);

  if (hash && blockieDataUri) {
    return (
      <img
        src={blockieDataUri}
        alt={`Avatar for ${hash.substring(0, 8)}`}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ 
          width: size, 
          height: size, 
          objectFit: 'cover',
          display: 'block'
        }}
        onError={(e) => {
          console.error('Image load error for hash:', hash);
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  if (hash) {
    // Fallback to initials if blockie generation fails
    return (
      <div
        className="rounded-full bg-gray-200 border-2 border-black flex items-center justify-center"
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <div className="text-xs font-bold text-black">
          {hash.substring(0, 2).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <Image
      src="/noprofile.png"
      alt="No profile"
      width={size}
      height={size}
      className="rounded-full"
    />
  );
}
