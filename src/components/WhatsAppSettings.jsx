import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { FiSave, FiMessageSquare, FiShield, FiBell, FiBell as BsWhatsapp } from 'react-icons/fi';

const WhatsAppSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        enabled: false,
        otpVerification: false,
        statusNotifications: false,
        accessToken: '',
        phoneNumberId: '',
        businessAccountId: '',
        webhookVerifyToken: ''
    });

    const [showToken, setShowToken] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/settings');
            setSettings(data.whatsapp || {
                enabled: false,
                otpVerification: false,
                statusNotifications: false,
                accessToken: '',
                phoneNumberId: '',
                businessAccountId: '',
                webhookVerifyToken: ''
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (field) => {
        setSettings(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleInputChange = (field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/settings/whatsapp', settings);
            toast.success('WhatsApp settings saved successfully!');
            fetchSettings(); // Refresh to get masked token
        } catch (error) {
            console.error('Failed to save WhatsApp settings:', error);
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="card p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <BsWhatsapp className="w-6 h-6 text-green-600" />
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">WhatsApp Notifications</h2>
                        <p className="text-sm text-gray-500">Configure WhatsApp Business API integration</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Main Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FiMessageSquare className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">Enable WhatsApp Notifications</p>
                            <p className="text-sm text-gray-500">Master switch for all WhatsApp features</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={() => handleToggle('enabled')}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>

                {/* Feature Toggles */}
                {settings.enabled && (
                    <div className="space-y-4 pl-4 border-l-2 border-green-200">
                        {/* OTP Verification */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <FiShield className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="font-medium text-gray-800">OTP Verification</p>
                                    <p className="text-sm text-gray-500">Verify customer phone on new orders</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.otpVerification}
                                    onChange={() => handleToggle('otpVerification')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Status Notifications */}
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <FiBell className="w-5 h-5 text-purple-500" />
                                <div>
                                    <p className="font-medium text-gray-800">Status Notifications</p>
                                    <p className="text-sm text-gray-500">Auto-notify customers on status updates</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.statusNotifications}
                                    onChange={() => handleToggle('statusNotifications')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                    </div>
                )}

                {/* API Configuration */}
                {settings.enabled && (
                    <div className="hidden">
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="font-semibold text-gray-800 mb-4">Meta WhatsApp Business API Configuration</h3>
                            <div className="space-y-4">
                                {/* Access Token */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Access Token <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showToken ? "text" : "password"}
                                            value={settings.accessToken}
                                            onChange={(e) => handleInputChange('accessToken', e.target.value)}
                                            placeholder="Enter your Meta WhatsApp Access Token"
                                            className="input w-full pr-24"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowToken(!showToken)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            {showToken ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Get this from Meta Business Manager</p>
                                </div>

                                {/* Phone Number ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.phoneNumberId}
                                        onChange={(e) => handleInputChange('phoneNumberId', e.target.value)}
                                        placeholder="e.g., 123456789012345"
                                        className="input w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Your WhatsApp Business Phone Number ID</p>
                                </div>

                                {/* Business Account ID */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Business Account ID
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.businessAccountId}
                                        onChange={(e) => handleInputChange('businessAccountId', e.target.value)}
                                        placeholder="e.g., 123456789012345"
                                        className="input w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Optional: Your WhatsApp Business Account ID</p>
                                </div>

                                {/* Webhook Verify Token */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Webhook Verify Token
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.webhookVerifyToken}
                                        onChange={(e) => handleInputChange('webhookVerifyToken', e.target.value)}
                                        placeholder="Enter a secure random string"
                                        className="input w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">For webhook verification (future feature)</p>
                                </div>
                            </div>
                        </div>

                        {/* Setup Guide */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <FiMessageSquare className="w-4 h-4" />
                                Setup Guide
                            </h4>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Create a Meta Business account at business.facebook.com</li>
                                <li>Set up WhatsApp Business API in Business Manager</li>
                                <li>Get your Access Token and Phone Number ID</li>
                                <li>Paste them in the fields above</li>
                                <li>Enable the features you want to use</li>
                                <li>Click "Save Settings" below</li>
                            </ol>
                            <a
                                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                View Meta Documentation →
                            </a>
                        </div>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                        onClick={handleSave}
                        disabled={saving || !settings.enabled}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiSave className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save WhatsApp Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppSettings;
