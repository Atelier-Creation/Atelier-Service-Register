import { useState } from 'react';
import { FiSettings, FiBell, FiUser, FiLock, FiShield, FiChevronDown, FiChevronRight } from 'react-icons/fi';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');

    const sections = [
        {
            id: 'general',
            label: 'General',
            icon: FiSettings,
            color: 'bg-amber-50 text-amber-600',
            content: (
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <FiSettings className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">General Configuration</h3>
                            <p className="text-slate-500 text-xs">Update business details</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                            <input type="text" className="input-field" defaultValue="Digital Service Register" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                            <input type="email" className="input-field" defaultValue="admin@dsr.com" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button className="btn-primary">Save Changes</button>
                    </div>
                </div>
            )
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: FiBell,
            color: 'bg-blue-50 text-[#4361ee]',
            content: (
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-2 bg-blue-50 text-[#4361ee] rounded-lg">
                            <FiBell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Notifications</h3>
                            <p className="text-slate-500 text-xs">Configure how you receive alerts</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: 'WhatsApp Notifications', desc: 'Send automatic updates via WhatsApp' },
                            { title: 'SMS Alerts', desc: 'Send critical updates via SMS' },
                            { title: 'Email Reports', desc: 'Receive daily summary emails' }
                        ].map((setting, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2">
                                <div>
                                    <p className="font-medium text-slate-700">{setting.title}</p>
                                    <p className="text-slate-500 text-xs">{setting.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" defaultChecked />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4361ee]"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 'security',
            label: 'Security',
            icon: FiShield,
            color: 'bg-emerald-50 text-emerald-600',
            content: (
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <FiShield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Security</h3>
                            <p className="text-slate-500 text-xs">Protect your account and data</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group">
                            <span className="text-slate-700 font-medium group-hover:text-[#4361ee]">Change Password</span>
                            <span className="text-slate-400 text-sm">Last changed 30 days ago</span>
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group">
                            <span className="text-slate-700 font-medium group-hover:text-[#4361ee]">Two-Factor Authentication</span>
                            <span className="text-slate-400 text-sm">Disabled</span>
                        </button>
                    </div>
                </div>
            )
        },
        {
            id: 'users',
            label: 'User Management',
            icon: FiUser,
            color: 'bg-indigo-50 text-indigo-600',
            content: (
                <div className="card p-6 flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <FiUser className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">User Management</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Manage team members, roles, and permissions.</p>
                    <button className="btn-primary mt-4">Add New User</button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                <p className="text-slate-500 text-sm mt-1">Manage preferences and system configuration</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Desktop Navigation sidebar */}
                <div className="hidden lg:block lg:col-span-1 space-y-2">
                    {sections.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-3 ${activeTab === item.id
                                    ? 'bg-blue-50 text-[#4361ee] shadow-sm ring-1 ring-blue-100'
                                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Content Panel */}
                <div className="lg:col-span-3 space-y-4 lg:space-y-0">

                    {/* Mobile: Accordion Layout */}
                    <div className="lg:hidden space-y-4">
                        {sections.map((item) => (
                            <div key={item.id} className="space-y-2">
                                {/* Mobile Heading / Accordion Trigger */}
                                <button
                                    onClick={() => setActiveTab(activeTab === item.id ? '' : item.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeTab === item.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                            : 'bg-white text-slate-700 border border-slate-100 shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${activeTab === item.id ? 'bg-white/20 text-white' : item.color}`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold">{item.label}</span>
                                    </div>
                                    {activeTab === item.id ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5 text-slate-400" />}
                                </button>

                                {/* Mobile Content */}
                                {activeTab === item.id && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        {item.content}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop: Content Card */}
                    <div className="hidden lg:block relative min-h-[500px]">
                        {sections.find(s => s.id === activeTab)?.content}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
