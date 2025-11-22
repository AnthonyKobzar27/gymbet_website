'use client';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'default';
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  onConfirm,
  onCancel,
  type = 'default',
}: ConfirmDialogProps) {
  if (!visible) return null;

  const confirmBg = type === 'danger' ? 'bg-[#FF4444]' : 'bg-black';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-5">
      <div className="bg-white border-4 border-black p-6 w-full max-w-md shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-xl font-extrabold tracking-wide mb-3">{title}</div>
        <div className="text-sm font-semibold text-gray-600 mb-6">{message}</div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white border-[3px] border-black p-3.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="text-xs font-extrabold tracking-wide text-black">{cancelLabel}</div>
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${confirmBg} border-[3px] border-black p-3.5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
          >
            <div className="text-xs font-extrabold tracking-wide text-white">{confirmLabel}</div>
          </button>
        </div>
      </div>
    </div>
  );
}


