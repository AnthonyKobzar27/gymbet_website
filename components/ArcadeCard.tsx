import { ReactNode } from 'react';

interface ArcadeCardProps {
  children: ReactNode;
  onClick?: () => void;
}

export default function ArcadeCard({ children, onClick, className = "" }: ArcadeCardProps & { className?: string }) {
  const baseClasses = "border-4 border-black bg-white mb-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]";
  const interactiveClasses = onClick ? "cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "";

  if (onClick) {
    return (
      <div 
        className={`${baseClasses} ${interactiveClasses} ${className}`}
        onClick={onClick}
      >
        <div className="p-5 h-full flex flex-col">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="p-5 h-full flex flex-col">
        {children}
      </div>
    </div>
  );
}

