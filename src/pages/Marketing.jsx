import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { FiSend, FiUsers, FiMessageSquare, FiInfo } from 'react-icons/fi';

const Marketing = () => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [stats, setStats] = useState(null);

    const handleSend = async (e) => {
        e.preventDefault();

        if (!message.trim()) {
            toast.error('Please enter a specific message');
            return;
        }

        if (!window.confirm('Are you sure you want to send this message to ALL customers? This action cannot be undone.')) {
            return;
        }

        setSending(true);
        setStats(null);

        try {
            const { data } = await api.post('/marketing/send', {
                message,
                audience: 'all'
            });

            setStats(data);
            if (data.successful > 0) {
                toast.success(`Successfully sent to ${data.successful} customers!`);
                setMessage('');
            } else {
                toast.error('Failed to send messages. Check settings or logs.');
            }
        } catch (error) {
            console.error('Marketing send error:', error);
            toast.error(error.response?.data?.message || 'Failed to send messages');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Marketing</h1>
                <p className="text-gray-500 text-sm mt-1">Send bulk WhatsApp updates to your customers</p>
            </div>

            <div className="card overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FiMessageSquare className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">New Campaign</h2>
                            <p className="text-sm text-gray-600">Compose and broadcast a message</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Audience Selector (Static for now) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiUsers className="text-gray-400" />
                            </div>
                            <select className="input-field pl-10 bg-gray-50 text-gray-500 cursor-not-allowed" disabled>
                                <option value="all">All Customers</option>
                            </select>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Currently broadcasting to all registered customers with valid phone numbers.</p>
                    </div>

                    {/* Message Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={6}
                            className="input-field resize-none"
                            placeholder="Type your marketing message here... e.g., 'Special Offer: 20% off on all repairs this week!'"
                        ></textarea>
                        <p className="text-xs text-gray-500 mt-1 text-right">{message.length} characters</p>
                    </div>

                    {/* Guidelines */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <FiInfo className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-semibold text-amber-800">Important Guidelines</h4>
                            <ul className="text-xs text-amber-700 mt-1 list-disc list-inside space-y-1">
                                <li>Ensure your message complies with WhatsApp Business policies.</li>
                                <li>Avoid spammy content to prevent your number from being banned.</li>
                                <li>Messages are sent sequentially with a delay to respect rate limits.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Send Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            onClick={handleSend}
                            disabled={sending || !message.trim()}
                            className="btn-primary flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3"
                        >
                            {sending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Sending Broadcast...
                                </>
                            ) : (
                                <>
                                    <FiSend className="w-4 h-4" />
                                    Send Broadcast
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Campaign Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-scale-in">
                    <div className="card p-4 border-l-4 border-l-blue-500">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total Targeted</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                    <div className="card p-4 border-l-4 border-l-green-500">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Successfully Sent</p>
                        <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
                    </div>
                    <div className="card p-4 border-l-4 border-l-red-500">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Failed</p>
                        <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketing;
