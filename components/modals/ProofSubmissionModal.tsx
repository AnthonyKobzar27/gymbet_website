'use client';

import { useState, useRef } from 'react';

interface ProofSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (photoFile: File, caption: string) => Promise<void>;
  gameId: string;
  splitType: string;
}

export default function ProofSubmissionModal({
  visible,
  onClose,
  onSubmit,
  gameId,
  splitType,
}: ProofSubmissionModalProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!visible) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!photoFile) {
      alert('Please take a photo first');
      return;
    }

    if (!caption.trim()) {
      alert('Please add a caption');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(photoFile, caption);
      handleClose();
    } catch (error) {
      console.error('Error submitting proof:', error);
      alert('Failed to submit proof');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setCaption('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {!photoPreview ? (
        <>
          <div className="flex justify-between items-center pt-16 px-5">
            <button onClick={handleClose} className="p-2.5">
              <div className="text-2xl font-extrabold text-white">✕</div>
            </button>
            <div className="text-base font-extrabold tracking-wide text-white">
              TAKE WORKOUT PROOF
            </div>
            <div className="w-12" />
          </div>

          <div className="flex-1 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-white border-4 border-white flex items-center justify-center mx-auto mb-4"
              >
                <div className="w-15 h-15 rounded-full bg-gray-200" />
              </button>
              <div className="text-white text-sm font-semibold">Tap to take photo</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center pt-16 px-5">
            <button onClick={() => setPhotoPreview(null)} className="p-2.5">
              <div className="text-base font-extrabold text-white">← RETAKE</div>
            </button>
            <div className="text-base font-extrabold tracking-wide text-white">
              ADD CAPTION
            </div>
            <div className="w-12" />
          </div>

          <div className="flex-1 bg-black flex items-center justify-center">
            <img
              src={photoPreview}
              alt="Proof preview"
              className="max-w-full max-h-[60vh] object-contain"
            />
          </div>

          <div className="bg-white p-5">
            <textarea
              placeholder="Add a caption (e.g., 'Leg day complete!')"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              className="w-full border-[3px] border-black bg-white p-3 text-base font-semibold min-h-[80px] mb-4 focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full bg-black border-4 border-black py-4.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                submitting ? 'opacity-60' : ''
              }`}
            >
              {submitting ? (
                <div className="text-white text-sm font-extrabold tracking-wide text-center">
                  Submitting...
                </div>
              ) : (
                <div className="text-white text-sm font-extrabold tracking-wide text-center">
                  SUBMIT PROOF
                </div>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}


