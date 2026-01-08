import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiFileText, FiSearch, FiUsers, FiSettings,
    FiLogOut, FiMenu, FiX, FiTool , FiChevronDown, FiTrendingUp,
    FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { useState, useRef, useEffect } from 'react';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // ... (menuItems remain same)
    const menuItems = [
        { path: '/', icon: FiHome, label: 'Dashboard' },
        { path: '/jobs', icon: FiFileText, label: 'Orders' },
        { path: '/3rd-party-stats', icon: FiTool , label: 'Out Source' },
        { path: '/customers', icon: FiUsers, label: 'Customers' },
        ...(user?.role === 'admin' ? [
            { path: '/reports', icon: FiTrendingUp, label: 'Reports' },
            { path: '/settings', icon: FiSettings, label: 'Settings' }
        ] : []),
    ];

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 
                transform transition-all duration-300 
                flex flex-col lg:static lg:inset-auto overflow-visible
                ${sidebarOpen ? 'trangray-x-0' : '-trangray-x-full lg:trangray-x-0'}
                w-64 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
                `}
            >
                {/* Logo */}
                <div className={`h-16 flex items-center border-b border-gray-100 relative transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                        <img src="/favicon.png" alt="Logo" className='h-full w-full object-contain' />
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>
                        <h1 className="font-bold text-gray-800 text-lg leading-tight">Registra</h1>
                        <p className="text-xs text-gray-400">by Atelier </p>
                    </div>

                    {/* Desktop Toggle Button - Positioned on the border */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex absolute -right-3 top-1/2 -trangray-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400 hover:text-blue-600 shadow-sm z-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        {isCollapsed ? <FiChevronRight size={14} /> : <FiChevronLeft size={14} />}
                    </button>

                    {/* Mobile Close Button (only visible on mobile when open) */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden absolute right-4 text-gray-400"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                title={isCollapsed ? item.label : ''}
                                className={`
                                    group flex items-center w-full p-2 mb-1 rounded-md font-medium text-[14.5px] transition-colors duration-200
                                    ${isActive
                                        ? 'bg-[#F2F5FF] text-[#3D5EE1]'
                                        : 'text-[#667085] hover:bg-[#DDE4FF] hover:text-[#3D5EE1]'}
                                    ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}
                                `}
                            >
                                <div className={`
                                    p-1.5 rounded-sm   flex items-center justify-center shrink-0
                                    ${isActive ? 'text-[#3D5EE1] bg-white shadow-sm' : 'text-[#667085] group-hover:text-[#3D5EE1]'}
                                `}>
                                    <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                                </div>
                                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-3 border-t border-gray-100 shrink-0">
                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? 'Logout' : ''}
                        className={`
                            group flex items-center w-full p-2 mb-1 rounded-md font-medium text-[14.5px] transition-colors duration-200
                            text-[#667085] hover:bg-red-50 hover:text-red-500
                            ${isCollapsed ? 'justify-center' : 'justify-start gap-3'}
                        `}
                    >
                        <div className="p-1.5 rounded-sm bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:text-red-500 text-[#667085]">
                            <FiLogOut className="w-[18px] h-[18px]" strokeWidth={2} />
                        </div>
                        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <FiMenu className="w-6 h-6" />
                        </button>

                        {/* Global Search */}
                        <div className="hidden md:flex items-center relative w-96">
                            <FiSearch className="absolute left-3 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search jobs, customers..."
                                className="w-full bg-gray-50 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:outline-0 focus:ring-blue-400 text-gray-600 placeholder-gray-400"
                            />
                            {/* <span className="absolute right-3 text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">⌘K</span> */}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* <button className="relative p-2 text-gray-400 hover:text-[#4361ee] hover:bg-blue-50 rounded-full transition-colors">
                            <FiBell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button> */}

                        <div className="h-8 w-px bg-gray-200 mx-1"></div>

                        <div className="relative" ref={userMenuRef}>
                            <div
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-3 cursor-pointer p-1.5 rounded-lg hover:bg-gray-50 transition-colors select-none"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#4361ee] to-[#3f37c9] flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-semibold text-gray-700 leading-none mb-1">{user?.username}</p>
                                    <p className="text-xs text-gray-500 capitalize leading-none">{user?.role}</p>
                                </div>
                                <FiChevronDown className={`hidden md:block w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Dropdown Menu */}
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animation-fade-in z-50">
                                    <div className="px-4 py-2 border-b border-gray-50 md:hidden">
                                        <p className="text-sm font-semibold text-gray-700">{user?.username}</p>
                                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                                    </div>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <FiLogOut className="w-4 h-4" />
                                        Log out
                                    </button>
                                </div>
                            )}
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
                    className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default Layout;
