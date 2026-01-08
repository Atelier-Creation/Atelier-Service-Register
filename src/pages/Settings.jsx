import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
    FiSettings, FiBell, FiUser, FiLock, FiShield,
    FiChevronDown, FiChevronRight, FiCheck, FiAlertCircle,
    FiTrash2, FiPlus, FiX,
    FiEyeOff,
    FiEye
} from 'react-icons/fi';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');

    // General Profile State
    const [profileData, setProfileData] = useState({
        name: '',
        username: '',
        currentPassword: '',
        newPassword: ''
    });
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    // User Management State
    const [users, setUsers] = useState([]);
    const [showUserForm, setShowUserForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'technician' });
    const [userLoading, setUserLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData(prev => ({ ...prev, name: user.name, username: user.username }));
        }
    }, [user]);

    // Fetch Users when tab is active and user is admin
    useEffect(() => {
        if (activeTab === 'users' && user?.role === 'admin') {
            fetchUsers();
        }
    }, [activeTab, user]);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/auth/users');
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMsg({ type: '', text: '' });

        try {
            const payload = {
                name: profileData.name,
                username: profileData.username
            };

            if (profileData.newPassword) {
                payload.password = profileData.newPassword;
            }

            await api.put('/auth/profile', payload);
            setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
            setProfileData(prev => ({ ...prev, newPassword: '', currentPassword: '' }));
        } catch (error) {
            setStatusMsg({ type: 'error', text: error.response?.data?.message || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setUserLoading(true);
        setStatusMsg({ type: '', text: '' }); // Clear global status or use local? Using global for simplicity

        try {
            await api.post('/auth/users', newUser);
            setShowUserForm(false);
            setNewUser({ name: '', username: '', password: '', role: 'technician' });
            fetchUsers();
            setStatusMsg({ type: 'success', text: 'User created successfully' });
        } catch (error) {
            setStatusMsg({ type: 'error', text: error.response?.data?.message || 'Failed to create user' });
        } finally {
            setUserLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/auth/users/${id}`);
            fetchUsers();
            setStatusMsg({ type: 'success', text: 'User removed' });
        } catch (error) {
            setStatusMsg({ type: 'error', text: 'Failed to delete user' });
        }
    };

    const staffCount = users.filter(u => u.role !== 'admin').length;
    const canAddUser = staffCount < 1;

    const sections = [
        {
            id: 'general',
            label: 'General',
            icon: FiSettings,
            color: 'bg-amber-50 text-amber-600',
            content: (
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <FiSettings className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">General Configuration</h3>
                            <p className="text-gray-500 text-xs">Update your business profile</p>
                        </div>
                    </div>

                    {statusMsg.text && activeTab === 'general' && (
                        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                            {statusMsg.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                            {statusMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name / Business Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={profileData.username}
                                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4 mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-3">Change Password (Optional)</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Leave blank to keep current"
                                        value={profileData.newPassword}
                                        onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
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
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-blue-50 text-[#4361ee] rounded-lg">
                            <FiBell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Notifications</h3>
                            <p className="text-gray-500 text-xs">Configure how you receive alerts</p>
                            <p className="text-orange-500 text-xs mt-1 font-medium">Not enabled for now</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: 'WhatsApp Notifications', desc: 'Send automatic updates via WhatsApp' },
                            { title: 'SMS Alerts', desc: 'Send critical updates via SMS' },
                            { title: 'Email Reports', desc: 'Receive daily summary emails' }
                        ].map((setting, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 opacity-60 pointer-events-none">
                                <div>
                                    <p className="font-medium text-gray-700">{setting.title}</p>
                                    <p className="text-gray-500 text-xs">{setting.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-not-allowed">
                                    <input type="checkbox" className="sr-only peer" disabled />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:trangray-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4361ee]"></div>
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
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <FiShield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Security</h3>
                            <p className="text-gray-500 text-xs">Protect your account and data</p>
                            <p className="text-orange-500 text-xs mt-1 font-medium">Not enabled for now</p>
                        </div>
                    </div>

                    <div className="space-y-3 opacity-60 pointer-events-none">
                        <button disabled className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group cursor-not-allowed">
                            <span className="text-gray-700 font-medium group-hover:text-[#4361ee]">Change Password</span>
                            <span className="text-gray-400 text-sm">Last changed 30 days ago</span>
                        </button>
                        <button disabled className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group cursor-not-allowed">
                            <span className="text-gray-700 font-medium group-hover:text-[#4361ee]">Two-Factor Authentication</span>
                            <span className="text-gray-400 text-sm">Disabled</span>
                        </button>
                    </div>
                </div>
            )
        },
        ...(user?.role === 'admin' ? [{
            id: 'users',
            label: 'User Management',
            icon: FiUser,
            color: 'bg-indigo-50 text-indigo-600',
            content: (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <FiUser className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">User Management</h3>
                                    <p className="text-gray-500 text-xs">Manage team members (Max 1 Staff)</p>
                                </div>
                            </div>
                            {canAddUser && !showUserForm && (
                                <button onClick={() => setShowUserForm(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
                                    <FiPlus /> Add User
                                </button>
                            )}
                        </div>

                        {statusMsg.text && activeTab === 'users' && (
                            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                }`}>
                                {statusMsg.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
                                {statusMsg.text}
                            </div>
                        )}

                        {/* Add User Form */}
                        {showUserForm && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 animate-fade-in relative">
                                <button onClick={() => setShowUserForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                    <FiX />
                                </button>
                                <h4 className="font-bold text-gray-700 mb-4">Add New User</h4>
                                <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            <input type="text" className="input-field" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Username / Login ID</label>
                                            <input type="text" className="input-field" required value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="input-field pr-10"
                                                    required
                                                    value={newUser.password}
                                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -trangray-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >
                                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                                <option value="technician">Technician</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-2">
                                        <button type="submit" className="btn-primary" disabled={userLoading}>{userLoading ? 'Creating...' : 'Create User'}</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {!canAddUser && !showUserForm && (
                            <div className="bg-amber-50 text-amber-600 border border-amber-100 p-3 rounded-lg text-sm mb-4">
                                You have reached the limit of 1 user account. Delete an existing user to create a new one.
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u._id}>
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-gray-800">{u.name}</p>
                                                <p className="text-xs text-gray-400">@{u.username}</p>
                                            </td>
                                            <td className="py-3 px-4 capitalize text-sm text-gray-600">{u.role}</td>
                                            <td className="py-3 px-4 text-right">
                                                {u.role !== 'admin' && (
                                                    <button onClick={() => handleDeleteUser(u._id)} className="text-gray-400 hover:text-red-500 p-2">
                                                        <FiTrash2 />
                                                    </button>
                                                )}
                                                {u._id === user?._id && <span className="text-xs text-gray-400 italic">Current User</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )
        }] : [])
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage preferences and system configuration</p>
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
                                : 'text-gray-600 hover:bg-white hover:text-gray-900'
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
                                <button
                                    onClick={() => setActiveTab(activeTab === item.id ? '' : item.id)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeTab === item.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                        : 'bg-white text-gray-700 border border-gray-100 shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${activeTab === item.id ? 'bg-white/20 text-white' : item.color}`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold">{item.label}</span>
                                    </div>
                                    {activeTab === item.id ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5 text-gray-400" />}
                                </button>
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
