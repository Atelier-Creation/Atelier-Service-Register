import { useJobs } from '../context/JobContext';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiFileText, FiUsers, FiBox, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import Select from '../components/ui/Select';

import { useState } from 'react';

const Dashboard = () => {
    const { jobs, getJobStats } = useJobs();
    const { user } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const stats = getJobStats();

    // Helper for Status Classes
    const getStatusClass = (status) => {
        const classes = {
            received: 'status-received',
            'in-progress': 'status-in-progress',
            waiting: 'status-waiting',
            ready: 'status-ready',
            delivered: 'status-delivered',
        };
        return classes[status] || 'status-received';
    };

    // Filter logic for Technician
    const today = new Date().toISOString().split('T')[0];
    const todayDeliveryJobs = jobs.filter(job => job.estimatedDelivery === today);
    const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())).slice(0, 5);

    // Monthly Jobs Logic
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyJobCount = jobs.filter(job => {
        const d = new Date(job.createdAt);
        return d.getMonth() === parseInt(selectedMonth) && d.getFullYear() === new Date().getFullYear();
    }).length;

    // Mock data for charts - in production this would come from the context/API
    const chartData = [
        { name: 'Jan', sales: 4000, profit: 2400 },
        { name: 'Feb', sales: 3000, profit: 1398 },
        { name: 'Mar', sales: 2000, profit: 9800 },
        { name: 'Apr', sales: 2780, profit: 3908 },
        { name: 'May', sales: 1890, profit: 4800 },
        { name: 'Jun', sales: 2390, profit: 3800 },
        { name: 'Jul', sales: 3490, profit: 4300 },
    ];

    const pieData = [
        { name: 'Electronics', value: 400 },
        { name: 'Home', value: 300 },
        { name: 'Services', value: 300 },
        { name: 'Parts', value: 200 },
    ];

    const COLORS = ['#4361ee', '#3f37c9', '#4cc9f0', '#f72585'];

    const statCards = [
        {
            title: 'Total Orders',
            value: stats.total,
            label: 'Number of orders',
            icon: FiFileText,
            color: 'bg-blue-100 text-blue-600',
        },
        {
            title: 'Active Customers',
            value: stats.total || 0, // Placeholder
            label: 'Registered customers',
            icon: FiUsers,
            color: 'bg-indigo-100 text-indigo-600',
        },
        {
            title: 'Ready to Deliver',
            value: stats.statusCounts?.ready || 0,
            label: 'Available for pickup',
            icon: FiBox,
            color: 'bg-emerald-100 text-emerald-600',
        },
        {
            title: 'Total Revenue',
            value: `₹${stats.totalEarnings.toLocaleString()}`,
            label: 'Revenue generated',
            icon: FiDollarSign,
            color: 'bg-amber-100 text-amber-600',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Last updated: {new Date().toLocaleString()}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/jobs" className="btn-primary flex items-center gap-2">
                        <FiFileText />
                        New Order
                    </Link>
                    <Link to="/jobs" className="btn-secondary">
                        View Reports
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards
                    .filter(stat => user?.role === 'admin' || !['Total Revenue'].includes(stat.title))
                    .map((stat, index) => (
                        <div key={index} className="card p-6 flex flex-col justify-between h-40 relative overflow-hidden group">
                            <div className="flex justify-between items-start">
                                <div className={`p-3 rounded-xl ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <button className="text-slate-300 hover:text-slate-500 transition-colors">
                                    <FiArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</h3>
                                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                            </div>
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500 text-blue-600"></div>
                        </div>
                    ))}

                {/* Monthly Jobs Card (For Technicians) */}
                {user?.role === 'technician' && (
                    <div className="card p-6 h-40 flex flex-col justify-between relative overflow-visible group">
                        <div className="flex justify-between items-start z-20">
                            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                                <FiCalendar className="w-6 h-6" />
                            </div>
                            <div className="w-32">
                                <Select
                                    value={selectedMonth}
                                    onChange={(val) => setSelectedMonth(val)}
                                    options={months.map((m, i) => ({ label: m, value: i }))}
                                    triggerClassName="border-none bg-transparent shadow-none p-0 h-auto justify-end gap-2 text-slate-500 hover:text-indigo-600 focus:ring-0"
                                    className="min-w-[100px]"
                                />
                            </div>
                        </div>

                        <div className="z-10">
                            <h3 className="text-3xl font-bold text-slate-800 mb-1">{monthlyJobCount}</h3>
                            <p className="text-slate-500 text-sm font-medium">Orders created in {months[selectedMonth]}</p>
                        </div>

                        {/* Hover effect decoration container */}
                        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-0">
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-600 opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Charts Section - Admin Only */}
            {user?.role === 'admin' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                    {/* Main Area Chart */}
                    <div className="card p-6 lg:col-span-2 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 text-lg">Sales & Profit Overview</h3>
                            <div className="w-32">
                                <Select
                                    value="Monthly"
                                    onChange={() => { }}
                                    options={['Monthly', 'Weekly', 'Daily']}
                                />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4361ee" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4361ee" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4cc9f0" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4cc9f0" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1e293b' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sales"
                                        stroke="#4361ee"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorSales)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="profit"
                                        stroke="#4cc9f0"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorProfit)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="card p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 text-lg">By Category</h3>
                            <div className="w-32">
                                <Select
                                    value="Monthly"
                                    onChange={() => { }}
                                    options={['Monthly']}
                                />
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-slate-600 text-sm font-medium ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Label */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-800">1.2k</p>
                                    <p className="text-xs text-slate-400">Total Items</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Technician Dashboard Sections */}
            {user?.role === 'technician' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                    {/* Today's Deliveries */}
                    <div className="card p-6 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <FiCalendar className="text-blue-500" />
                                Today's Deliveries
                            </h3>
                            <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                {todayDeliveryJobs.length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {todayDeliveryJobs.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                                    No deliveries scheduled for today
                                </div>
                            ) : (
                                todayDeliveryJobs.map(job => (
                                    <div key={job.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all">
                                        <div>
                                            <p className="font-semibold text-slate-700 text-sm">{job.customerName}</p>
                                            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                                                {job.device}
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                #{job.id.slice(-4)}
                                            </p>
                                        </div>
                                        <span className={`scale-90 origin-right status-badge ${getStatusClass(job.status)}`}>
                                            {job.status.replace('-', ' ')}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="card p-6 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <FiFileText className="text-blue-500" />
                                Recent Orders
                            </h3>
                            <Link to="/jobs" className="text-sm text-blue-600 hover:underline font-medium">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {recentJobs.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-8">No recent activity.</p>
                            ) : (
                                recentJobs.map(job => (
                                    <div key={job.id} className="flex items-center gap-4 p-2 hover:bg-slate-50 rounded-lg transition-colors -mx-2">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold border border-slate-200 shrink-0">
                                            {job.customerName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className="font-semibold text-slate-700 text-sm truncate">{job.customerName}</p>
                                                <span className="text-xs text-slate-400 whitespace-nowrap">
                                                    {new Date(job.createdAt || Date.now()).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-slate-500 text-xs truncate pr-2">{job.device} - {job.issue?.slice(0, 20)}...</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${getStatusClass(job.status).replace('border', '')}`}>
                                                    {job.status.replace('-', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
