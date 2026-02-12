import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { FiClock, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiShield } from 'react-icons/fi';

const OTPVerification = ({ phone, onVerified, onCancel }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(0);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [messageId, setMessageId] = useState(null);
    const inputs = useRef([]);

    useEffect(() => {
        sendOtp();
    }, []);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const sendOtp = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/otp/send', { phone });
            setTimer(300); // 5 minutes
            setMessageId(data.messageId);
            toast.success('OTP sent to WhatsApp');
            // Focus first input
            if (inputs.current[0]) inputs.current[0].focus();
        } catch (error) {
            console.error('Send OTP error:', error);
            const msg = error.response?.data?.message || 'Failed to send OTP';
            toast.error(msg);

            // If rate limited, we might want to allow cancel
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            toast.error('Please enter the complete 6-digit code');
            return;
        }

        setVerifying(true);
        try {
            await api.post('/otp/verify', { phone, otp: otpCode });
            toast.success('Phone verified successfully!');
            onVerified();
        } catch (error) {
            console.error('Verify OTP error:', error);
            toast.error(error.response?.data?.message || 'Verification failed');
            setOtp(['', '', '', '', '', '']);
            inputs.current[0].focus();
        } finally {
            setVerifying(false);
        }
    };

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
        // Handle enter
        if (e.key === 'Enter') {
            handleVerify();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split('').forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);

        if (inputs.current[Math.min(pastedData.length, 5)]) {
            inputs.current[Math.min(pastedData.length, 5)].focus();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md mx-auto animate-fade-in border border-gray-100">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiShield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Verify Phone Number</h3>
                <p className="text-gray-500 text-sm mt-1">
                    We've sent a code to <span className="font-semibold text-gray-700">{phone}</span>
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    via WhatsApp
                </p>
            </div>

            {/* OTP Inputs */}
            <div className="flex justify-center gap-2 mb-8">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="w-12 h-12 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all placeholder-gray-200"
                        placeholder="-"
                    />
                ))}
            </div>

            {/* Verify Button */}
            <button
                onClick={handleVerify}
                disabled={verifying || otp.some(d => !d)}
                className="w-full btn-primary bg-green-600 hover:bg-green-700 border-green-600 shadow-green-200 py-3 text-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {verifying ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Verifying...
                    </>
                ) : (
                    'Verify Code'
                )}
            </button>

            {/* Footer / Resend */}
            <div className="flex flex-col items-center gap-4">
                {timer > 0 ? (
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                        <FiClock className="w-4 h-4" />
                        Resend code in <span className="font-mono font-medium">{formatTime(timer)}</span>
                    </p>
                ) : (
                    <button
                        onClick={sendOtp}
                        disabled={loading}
                        className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Resend Code
                    </button>
                )}

                <button
                    onClick={onCancel}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                    Cancel Verification
                </button>
            </div>
        </div>
    );
};

export default OTPVerification;
