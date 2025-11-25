'use client';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
      <div className="text-lg font-extrabold mb-2">{title}</div>
      <div className="text-sm font-semibold text-gray-600 mb-4">{message}</div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-black border-4 border-black py-3 px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="text-white text-sm font-extrabold tracking-wide">{actionLabel}</div>
        </button>
      )}
    </div>
  );
}





