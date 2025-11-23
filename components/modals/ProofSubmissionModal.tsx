'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * CAMERA-ONLY PROOF SUBMISSION MODAL
 * 
 * This modal uses ONLY the browser's getUserMedia API to access the camera.
 * There is NO file input, NO gallery access, NO camera roll access.
 * Users MUST take a photo directly from the camera in real-time.
 * 
 * Security: The photo is captured directly from the live video stream
 * to a canvas element, then converted to a File blob. There is no way
 * for users to upload existing photos from their device.
 */

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
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (visible && !photoPreview) {
      startCamera();
    } else if (!visible) {
      stopCamera();
      // Reset state when modal closes
      setPhotoBlob(null);
      setPhotoPreview(null);
      setCaption('');
      setCameraError(null);
      setPermissionGranted(false);
    }

    return () => {
      stopCamera();
    };
  }, [visible, photoPreview]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        setCameraError('Camera access requires a browser environment.');
        return;
      }
      
      // Check HTTPS requirement (getUserMedia requires secure context)
      const isSecureContext = window.isSecureContext || 
                             location.protocol === 'https:' || 
                             location.hostname === 'localhost' || 
                             location.hostname === '127.0.0.1';
      
      if (!isSecureContext) {
        setCameraError('Camera access requires HTTPS. Please access this site over HTTPS (https://) or use localhost.');
        return;
      }
      
      // Check if getUserMedia is available
      let getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Modern API - this should trigger permission prompt
        getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      } else {
        // Fallback for older browsers
        const legacyGetUserMedia = (navigator as any).getUserMedia || 
                                  (navigator as any).webkitGetUserMedia || 
                                  (navigator as any).mozGetUserMedia || 
                                  (navigator as any).msGetUserMedia;
        
        if (!legacyGetUserMedia) {
          setCameraError('Camera access is not supported in this browser. Please use a modern browser.');
          return;
        }
        
        // Wrap legacy API in Promise
        getUserMedia = (constraints: MediaStreamConstraints) => {
          return new Promise<MediaStream>((resolve, reject) => {
            legacyGetUserMedia.call(navigator, constraints, resolve, reject);
          });
        };
      }
      
      console.log('Requesting camera access...');
      
      // Try with back camera first, fallback to any camera
      let stream: MediaStream;
      try {
        stream = await getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      } catch (facingModeError: any) {
        // If facingMode fails, try without it
        console.log('Back camera not available, trying any camera...');
        stream = await getUserMedia({
          video: true,
          audio: false,
        });
      }
      
      console.log('Camera access granted, stream:', stream);
      
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setPermissionGranted(true);
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError('Camera is already in use. Please close other apps using the camera.');
      } else if (error.name === 'SecurityError' || error.name === 'NotSupportedError') {
        setCameraError('Camera access requires HTTPS. Please access this site over HTTPS (https://) or use localhost.');
      } else {
        setCameraError(`Failed to access camera: ${error.message || 'Unknown error'}. Please ensure you are using HTTPS.`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Verify we have an active video stream (camera must be running)
    if (!video.srcObject) {
      alert('Camera not ready. Please wait for camera to initialize.');
      return;
    }
    
    // Wait for video to be ready (check readyState)
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      alert('Camera not ready. Please wait for camera to initialize.');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // CAMERA-ONLY: Capture frame directly from live video stream
    // This ensures the photo is taken in real-time, not from gallery
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a File from the blob captured from camera stream
        // Timestamp in filename ensures it's a new photo, not an uploaded file
        const file = new File([blob], `proof-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPhotoBlob(file);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(blob);
        setPhotoPreview(previewUrl);
        
        // Stop camera after taking picture
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const retakePicture = () => {
    setPhotoBlob(null);
    setPhotoPreview(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    startCamera();
  };

  const handleSubmit = async () => {
    if (!photoBlob) {
      alert('Please take a photo first');
      return;
    }

    if (!caption.trim()) {
      alert('Please add a caption');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(photoBlob as File, caption);
      handleClose();
    } catch (error) {
      console.error('Error submitting proof:', error);
      alert('Failed to submit proof');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoBlob(null);
    setPhotoPreview(null);
    setCaption('');
    setCameraError(null);
    setPermissionGranted(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {!photoPreview ? (
        <>
          <div className="flex justify-between items-center pt-4 px-5 pb-2">
            <button onClick={handleClose} className="p-2.5">
              <div className="text-2xl font-extrabold text-white">✕</div>
            </button>
            <div className="text-base font-extrabold tracking-wide text-white">
              TAKE WORKOUT PROOF
            </div>
            <div className="w-12" />
          </div>

          {cameraError ? (
            <div className="flex-1 flex items-center justify-center px-5">
              <div className="text-center">
                <div className="text-white text-lg font-bold mb-4">{cameraError}</div>
                <button
                  onClick={startCamera}
                  className="bg-white border-2 border-black px-6 py-3 text-black font-extrabold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 relative bg-black overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!permissionGranted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-white text-center">
                      <div className="text-lg font-bold mb-2">Requesting camera access...</div>
                      <div className="text-sm">Please allow camera permission</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-black pb-8 pt-4">
                <div className="flex justify-center">
                  <button
                    onClick={takePicture}
                    disabled={!permissionGranted}
                    className="w-20 h-20 rounded-full bg-white border-4 border-white flex items-center justify-center disabled:opacity-50"
                  >
                    <div className="w-16 h-16 rounded-full bg-white border-4 border-black" />
                  </button>
                </div>
                <div className="text-white text-sm font-semibold text-center mt-4">
                  Tap to take photo
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center pt-4 px-5 pb-2">
            <button onClick={retakePicture} className="p-2.5">
              <div className="text-xl font-extrabold text-white">↻</div>
            </button>
            <div className="text-base font-extrabold tracking-wide text-white">
              REVIEW PROOF
            </div>
            <div className="w-12" />
          </div>

          <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
            <img
              src={photoPreview}
              alt="Proof preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <div className="bg-black p-5">
            <div className="mb-4">
              <div className="text-xs font-bold text-white tracking-wide uppercase mb-2">
                CAPTION
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe your workout..."
                className="w-full border-2 border-black bg-white p-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-black resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={retakePicture}
                disabled={submitting}
                className="flex-1 bg-white border-2 border-black p-3.5 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-60"
              >
                <div className="text-sm font-extrabold tracking-wide text-black">RETAKE</div>
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !caption.trim()}
                className="flex-1 bg-black border-2 border-black p-3.5 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-60"
              >
                {submitting ? (
                  <div className="text-sm font-extrabold tracking-wide text-white">SUBMITTING...</div>
                ) : (
                  <div className="text-sm font-extrabold tracking-wide text-white">SUBMIT PROOF</div>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Hidden canvas for capturing photo */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
