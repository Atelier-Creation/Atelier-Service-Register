import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiFileText, FiSearch, FiUsers, FiSettings,
    FiLogOut, FiMenu, FiX, FiBell, FiChevronDown, FiTrendingUp
} from 'react-icons/fi';
import { useState } from 'react';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { path: '/', icon: FiHome, label: 'Dashboard' },
        { path: '/jobs', icon: FiFileText, label: 'Orders' },
        { path: '/3rd-party-stats', icon: FiTrendingUp, label: 'Out Source' },
        { path: '/customers', icon: FiUsers, label: 'Customers' },
        ...(user?.role === 'admin' ? [{ path: '/settings', icon: FiSettings, label: 'Settings' }] : []),
    ];

    return (
        <div className="h-screen overflow-hidden bg-slate-50 flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <img src="/Dark_Logo.png" alt="Atelier Logo" srcset="/Dark_Logo.png" className='h-8 w-8 object-contain' />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 text-lg leading-tight">Atelier</h1>
                        <p className="text-xs text-slate-400 font-medium">Service Register</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-[#4361ee]' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-100 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <FiLogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-slate-500 hover:text-slate-700"
                        >
                            <FiMenu className="w-6 h-6" />
                        </button>

                        {/* Global Search */}
                        <div className="hidden md:flex items-center relative w-96">
                            <FiSearch className="absolute left-3 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search jobs, customers..."
                                className="w-full bg-slate-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/10 text-slate-600 placeholder-slate-400"
                            />
                            <span className="absolute right-3 text-xs text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">⌘K</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:text-[#4361ee] hover:bg-blue-50 rounded-full transition-colors">
                            <FiBell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="h-8 w-px bg-slate-200 mx-1"></div>

                        <div className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4361ee] to-[#3f37c9] flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-semibold text-slate-700 leading-none mb-1">{user?.username}</p>
                                <p className="text-xs text-slate-500 capitalize leading-none">{user?.role}</p>
                            </div>
                            <FiChevronDown className="hidden md:block w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default Layout;
