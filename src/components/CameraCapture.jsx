import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiRefreshCw, FiCamera } from 'react-icons/fi';

const CameraCapture = ({ onCapture, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // Default to rear camera
    const [error, setError] = useState('');

    const startCamera = async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode },
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError('');
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError('Camera access denied or not supported. Please allow camera permissions.');
        }
    };

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stream]);

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                const context = canvas.getContext('2d');

                // Set canvas dimensions to match video stream
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw video frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert to Blob/File
                canvas.toBlob((blob) => {
                    const file = new File([blob], `capture_${Date.now()}.png`, { type: 'image/png' });
                    onCapture(file);
                    // We don't close automatically to allow multiple shots? 
                    // User usually wants to take one and verify.
                    // Or take multiple.
                    // For now, let's keep it open, but maybe show a flash or toast?
                    // User request didn't specify. I'll just trigger capture.
                    // Ideally, we visually indicate capture.

                    // Add a flash effect
                    const flash = document.getElementById('camera-flash');
                    if (flash) {
                        flash.style.opacity = '1';
                        setTimeout(() => flash.style.opacity = '0', 100);
                    }

                }, 'image/png');
            }
        }
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center sm:p-4 animate-fade-in">
            <div className="relative w-full h-full sm:h-auto sm:max-w-md bg-black sm:rounded-2xl overflow-hidden shadow-2xl sm:border border-gray-800 flex flex-col">

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                    <span className="text-white font-medium text-sm flex items-center gap-2">
                        <FiCamera /> Take Photo
                    </span>
                    <button onClick={onClose} className="text-white bg-white/20 p-2 rounded-full hover:bg-white/30 backdrop-blur-sm transition-all z-30">
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Video Feed */}
                <div className="relative flex-1 bg-gray-900 w-full flex items-center justify-center overflow-hidden">
                    {/* Flash Overlay */}
                    <div id="camera-flash" className="absolute inset-0 bg-white opacity-0 pointer-events-none transition-opacity duration-100 z-10"></div>

                    {error ? (
                        <div className="text-red-500 text-center p-8 max-w-xs">
                            <p className="mb-2 text-lg">📷</p>
                            {error}
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Controls */}
                <div className="bg-black/90 p-8 flex items-center justify-around z-20">
                    <button onClick={switchCamera} className="text-white p-4 rounded-full bg-gray-800 hover:bg-gray-700 transition-all active:scale-95">
                        <FiRefreshCw className="w-6 h-6" />
                    </button>

                    <button
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/30 transition-all active:scale-95 shadow-lg shadow-white/10"
                        title="Capture"
                    >
                        <div className="w-16 h-16 bg-white rounded-full"></div>
                    </button>

                    <div className="w-14"></div> {/* Spacer for visual balance with switch button */}
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>,
        document.body
    );
};

export default CameraCapture;
