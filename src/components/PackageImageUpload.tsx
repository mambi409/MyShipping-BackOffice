import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  RefreshCw,
  Trash2,
  ZoomIn,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  SwitchCamera,
} from 'lucide-react';
import { compressImageFile, captureVideoFrame, formatImageSize, ProcessedImageResult } from '../utils/imageUtils';

interface PackageImageUploadProps {
  value?: string;
  onChange: (image: string | undefined) => void;
  label?: string;
  helperText?: string;
  className?: string;
  idPrefix?: string;
}

export const PackageImageUpload: React.FC<PackageImageUploadProps> = ({
  value,
  onChange,
  label = 'Package Inspection Photo',
  helperText = 'Capture or upload a clear photo of the package, shipping label, or container condition',
  className = '',
  idPrefix = 'package-photo',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ size?: string; dimensions?: string } | null>(null);

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<ProcessedImageResult | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Hidden inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Compute meta on image load or when value changes
  useEffect(() => {
    if (!value) {
      setImageMeta(null);
      return;
    }

    try {
      const base64Str = value.split(',')[1] || '';
      const sizeBytes = Math.round((base64Str.length * 3) / 4);
      const img = new Image();
      img.onload = () => {
        setImageMeta({
          size: formatImageSize(sizeBytes),
          dimensions: `${img.naturalWidth} × ${img.naturalHeight}px`,
        });
      };
      img.src = value;
    } catch {
      setImageMeta(null);
    }
  }, [value]);

  // Clean up camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Check if multiple camera devices exist
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }).catch(() => {
        // ignore
      });
    }
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    stopCameraStream();
    setIsCameraStarting(true);
    setCameraError(null);
    setCapturedPreview(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your current browser environment.');
      setIsCameraStarting(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraStarting(false);
    } catch (err: unknown) {
      console.warn('Unable to access camera with requested constraints:', err);
      // Try fallback with basic video constraint
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play().catch(() => {});
        }
        setIsCameraStarting(false);
      } catch (fallbackErr) {
        console.error('Camera fallback failed:', fallbackErr);
        setCameraError('Unable to open camera. Please grant camera permission in your browser, or upload an image from your device.');
        setIsCameraStarting(false);
      }
    }
  }, [stopCameraStream]);

  // Open camera modal
  const handleOpenCamera = () => {
    setIsCameraOpen(true);
    setCapturedPreview(null);
    setCameraError(null);
    startCamera(facingMode);
  };

  // Close camera modal
  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCapturedPreview(null);
    setCameraError(null);
  };

  // Flip camera
  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture snapshot from video
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const result = captureVideoFrame(videoRef.current, 1200, 0.85);
    if (result) {
      setCapturedPreview(result);
    } else {
      setCameraError('Failed to capture frame from video.');
    }
  };

  // Confirm and use captured photo
  const handleConfirmCaptured = () => {
    if (capturedPreview) {
      onChange(capturedPreview.dataUrl);
      handleCloseCamera();
    }
  };

  // Process uploaded image file
  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const result = await compressImageFile(file, 1200, 0.82);
      onChange(result.dataUrl);
    } catch (err) {
      console.error('Image processing failed:', err);
      setErrorMessage('Could not process this image. Please try another file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  // Remove current image
  const handleRemoveImage = () => {
    onChange(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mobileCameraInputRef.current) mobileCameraInputRef.current.value = '';
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Helper Header */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            {label} <span className="text-slate-400 font-normal text-[11px] normal-case">(Optional)</span>
          </label>
          {helperText && <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>}
        </div>

        {value && (
          <button
            type="button"
            id={`${idPrefix}-remove-btn`}
            onClick={handleRemoveImage}
            className="text-xs text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Photo</span>
          </button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        id={`${idPrefix}-file-input`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />
      {/* Hidden Fallback Camera Input (for devices that prefer native camera app) */}
      <input
        ref={mobileCameraInputRef}
        id={`${idPrefix}-native-cam-input`}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileProcess(e.target.files[0]);
          }
        }}
      />

      {/* Processing Loader */}
      {isProcessing && (
        <div className="p-6 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
          <p className="text-xs font-semibold text-indigo-900">Optimizing package image...</p>
          <p className="text-[11px] text-indigo-600">Compressing for clear barcode and label visibility</p>
        </div>
      )}

      {/* State A: Image is Present */}
      {!isProcessing && value && (
        <div
          className="relative group bg-slate-900/5 rounded-2xl border border-slate-200 overflow-hidden p-3 transition-all"
          id={`${idPrefix}-preview-card`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Thumbnail */}
            <div className="relative w-full sm:w-44 h-36 bg-slate-900 rounded-xl overflow-hidden shadow-xs shrink-0 group/img">
              <img
                src={value}
                alt="Package Inspection"
                className="w-full h-full object-contain bg-slate-900/90"
              />
              <button
                type="button"
                id={`${idPrefix}-zoom-btn`}
                onClick={() => setIsZoomOpen(true)}
                title="Click to zoom and inspect photo"
                className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-semibold cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
                <span>Zoom Photo</span>
              </button>
            </div>

            {/* Info and Actions */}
            <div className="flex-1 w-full space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Photo Attached</span>
                </span>
                {imageMeta?.size && (
                  <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {imageMeta.size}
                  </span>
                )}
                {imageMeta?.dimensions && (
                  <span className="text-[11px] font-mono text-slate-500 hidden md:inline-block">
                    {imageMeta.dimensions}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Package inspection photo verified. Saved with consignment record for barcode verification and proof of condition.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  id={`${idPrefix}-inspect-btn`}
                  onClick={() => setIsZoomOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inspect Full Size</span>
                </button>

                <button
                  type="button"
                  id={`${idPrefix}-retake-cam-btn`}
                  onClick={handleOpenCamera}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Take New Picture</span>
                </button>

                <button
                  type="button"
                  id={`${idPrefix}-reupload-btn`}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload from Computer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* State B: No Image Present - Dual Choice (Take Picture OR Upload) */}
      {!isProcessing && !value && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed p-5 transition-all ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/60 scale-[1.005]'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
          id={`${idPrefix}-dropzone`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Option 1: Take a Picture */}
            <button
              type="button"
              id={`${idPrefix}-take-picture-btn`}
              onClick={handleOpenCamera}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center mb-2.5 transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                Take a Picture
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Use camera to capture package & label
              </span>
            </button>

            {/* Option 2: Upload from Computer */}
            <button
              type="button"
              id={`${idPrefix}-upload-computer-btn`}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center mb-2.5 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                Upload from Computer
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Browse file or drag and drop image here
              </span>
            </button>
          </div>

          {/* Quick note on formats */}
          <div className="mt-3 text-center">
            <p className="text-[11px] text-slate-400">
              Supported: JPG, PNG, WEBP (auto-compressed for clear barcode reading)
            </p>
          </div>
        </div>
      )}

      {/* Error Feedback */}
      {errorMessage && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* CAMERA VIEWFINDER MODAL */}
      {/* ========================================================= */}
      {isCameraOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          id={`${idPrefix}-camera-modal`}
        >
          <div className="bg-slate-900 text-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Take Package Inspection Photo</h3>
              </div>

              <div className="flex items-center gap-2">
                {hasMultipleCameras && !capturedPreview && (
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    title="Switch Camera (Front/Back)"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseCamera}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Viewfinder Area */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
              {/* Spinner when starting */}
              {isCameraStarting && (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs">Initializing camera feed...</span>
                </div>
              )}

              {/* Error Message */}
              {cameraError && (
                <div className="p-6 text-center max-w-md space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-900/40 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-rose-300">{cameraError}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => mobileCameraInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      Use Device Camera App
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseCamera();
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                    >
                      Upload File Instead
                    </button>
                  </div>
                </div>
              )}

              {/* Live Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${capturedPreview || cameraError ? 'hidden' : 'block'}`}
              />

              {/* Package Alignment Grid Guideline (Over video) */}
              {!capturedPreview && !cameraError && !isCameraStarting && (
                <div className="absolute inset-8 pointer-events-none border-2 border-white/30 rounded-xl flex items-center justify-center">
                  <div className="text-center text-white/60 text-xs px-3 py-1 rounded bg-black/40 backdrop-blur-xs font-mono">
                    Center package & shipping label here
                  </div>
                </div>
              )}

              {/* Captured Snapshot Preview */}
              {capturedPreview && (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <img
                    src={capturedPreview.dataUrl}
                    alt="Captured Snapshot"
                    className="w-full h-full object-contain max-h-[460px]"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Snapshot Captured</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Controls / Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
              {capturedPreview ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPreview(null);
                      if (videoRef.current && streamRef.current) {
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmCaptured}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-900/50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Use This Photo</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCloseCamera}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  {!cameraError && (
                    <button
                      type="button"
                      id={`${idPrefix}-capture-shutter-btn`}
                      onClick={handleCaptureSnapshot}
                      disabled={isCameraStarting}
                      className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capture Photo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      handleCloseCamera();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Upload instead
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ZOOM LIGHTBOX MODAL */}
      {/* ========================================================= */}
      {isZoomOpen && value && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">Package Inspection Photo</span>
                {imageMeta?.dimensions && (
                  <span className="text-[11px] text-slate-400 font-mono">({imageMeta.dimensions})</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[80vh] flex items-center justify-center bg-black">
              <img
                src={value}
                alt="Package Inspection Zoom"
                className="max-w-full max-h-[78vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
