import { useJobs } from '../context/JobContext';
import { useAuth } from '../context/AuthContext';
import { FiFileText, FiCalendar, FiUsers, FiBox } from 'react-icons/fi';
import { BsCurrencyRupee } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import Select from '../components/ui/Select';
import StatCard from '../components/ui/StatCard';

import { Skeleton } from '../components/ui/Skeleton';
import { useState, useEffect } from 'react';
import api from '../api/client';

const Dashboard = () => {
    const { jobs, getJobStats, loading: jobsLoading } = useJobs();
    const { user } = useAuth();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const stats = getJobStats();

    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [chartsLoading, setChartsLoading] = useState(true);
    const [chartPeriod, setChartPeriod] = useState('year');

    useEffect(() => {
        const fetchCharts = async () => {
            if (user?.role === 'admin') {
                try {
                    const { data } = await api.get(`/jobs/stats/charts?period=${chartPeriod}`);
                    setChartData(data.chartData);
                    setPieData(data.pieData);
                } catch (error) {
                    console.error("Failed to fetch charts", error);
                } finally {
                    setChartsLoading(false);
                }
            }
        };
        fetchCharts();
    }, [user, chartPeriod]);

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
    const todayDeliveryJobs = jobs.filter(job => {
        if (!job.estimatedDelivery) return false;
        // Normalize job date to YYYY-MM-DD
        const deliveryDate = new Date(job.estimatedDelivery).toISOString().split('T')[0];
        return deliveryDate === today;
    });
    const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())).slice(0, 5);

    // Monthly Jobs Logic
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyJobCount = jobs.filter(job => {
        const d = new Date(job.createdAt);
        return d.getMonth() === parseInt(selectedMonth) && d.getFullYear() === new Date().getFullYear();
    }).length;

    const COLORS = ['#4361ee', '#3f37c9', '#4cc9f0', '#f72585'];

    const statCards = [
        {
            title: 'Total Orders',
            value: stats.total,
            label: 'Number of orders',
            icon: FiFileText,
            color: 'bg-blue-100 text-blue-600',
            decorationColor: 'text-blue-600',
        },
        {
            title: 'Active Customers',
            value: stats.total || 0, // Placeholder
            label: 'Registered customers',
            icon: FiUsers,
            color: 'bg-indigo-100 text-indigo-600',
            decorationColor: 'text-indigo-600',
        },
        {
            title: 'Ready to Deliver',
            value: stats.statusCounts?.ready || 0,
            label: 'Available for pickup',
            icon: FiBox,
            color: 'bg-emerald-100 text-emerald-600',
            decorationColor: 'text-emerald-600',
        },
        {
            title: 'Total Revenue',
            value: `₹${stats.totalEarnings.toLocaleString()}`,
            label: 'Revenue generated',
            icon: BsCurrencyRupee,
            color: 'bg-amber-100 text-amber-600',
            decorationColor: 'text-amber-600',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Last updated: {new Date().toLocaleString()}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/jobs?action=new" className="btn-primary flex items-center gap-2">
                        <FiFileText />
                        New Order
                    </Link>
                    {user?.role === 'admin' && (
                        <Link to="/reports" className="btn-secondary">
                            View Reports
                        </Link>)}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 min-[425px]:grid-cols-2 lg:grid-cols-4 gap-6">
                {jobsLoading ? (
                    // Skeleton for Stat Cards
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="card p-6 flex justify-between items-start">
                            <div>
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-16 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-12 w-12 rounded-xl" />
                        </div>
                    ))
                ) : (
                    <>
                        {statCards
                            .filter(stat => user?.role === 'admin' || !['Total Revenue'].includes(stat.title))
                            .map((stat, index) => (
                                <StatCard
                                    key={index}
                                    {...stat}
                                    className="h-full"
                                />
                            ))}

                        {user?.role === 'technician' && (
                            <div className="card p-4 h-full flex flex-col justify-between relative group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3 z-10">
                                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                            <FiCalendar className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800">{monthlyJobCount}</h3>
                                    </div>
                                </div>

                                <div className="z-20 mt-2 flex items-center justify-between">
                                    <p className="text-gray-500 text-sm ">Orders in</p>
                                    <div className="w-28 z-20">
                                        <Select
                                            value={selectedMonth}
                                            onChange={(val) => setSelectedMonth(val)}
                                            options={months.map((m, i) => ({ label: m, value: i }))}
                                            triggerClassName="border-none bg-transparent shadow-none p-0 h-auto justify-end gap-2 text-gray-500 hover:text-indigo-600 focus:ring-0 text-sm"
                                            className="min-w-[80px]"
                                        />
                                    </div>
                                </div>

                                {/* Hover effect decoration container - acts as background */}
                                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-0">
                                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-600 opacity-[0.03] rounded-full group-hover:scale-125 transition-transform duration-700"></div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Charts Section - Admin Only */}
            {user?.role === 'admin' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                    {/* Main Area Chart */}
                    <div className="card p-6 lg:col-span-2 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-800 text-lg">Sales & Profit Overview</h3>
                            <div className="w-32">
                                <Select
                                    value={chartPeriod}
                                    onChange={(val) => setChartPeriod(val)}
                                    options={[
                                        { value: 'year', label: 'This Year' },
                                        { value: 'month', label: 'This Month' }
                                    ]}
                                    triggerClassName="focus:ring-0 focus:border-gray-200 shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="w-full h-80 lg:flex-1 lg:h-auto lg:min-h-0">
                            {chartsLoading ? (
                                <div className="w-full h-full flex items-end gap-2 p-4">
                                    <Skeleton className="h-1/3 w-full rounded-t-lg" />
                                    <Skeleton className="h-2/3 w-full rounded-t-lg" />
                                    <Skeleton className="h-1/2 w-full rounded-t-lg" />
                                    <Skeleton className="h-3/4 w-full rounded-t-lg" />
                                    <Skeleton className="h-full w-full rounded-t-lg" />
                                </div>
                            ) : (
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
                            )}
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="card p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-800 text-lg">By Category</h3>
                            <div className="w-32">
                                <Select
                                    value={chartPeriod}
                                    onChange={(val) => setChartPeriod(val)}
                                    options={[
                                        { value: 'year', label: 'This Year' },
                                        { value: 'month', label: 'This Month' }
                                    ]}
                                    triggerClassName="focus:ring-0 focus:border-gray-200 shadow-sm"
                                />
                            </div>
                        </div>
                        <div className="w-full h-80 lg:flex-1 lg:h-auto lg:min-h-0 relative">
                            {chartsLoading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Skeleton className="h-48 w-48 rounded-full" />
                                </div>
                            ) : (
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
                                            formatter={(value) => <span className="text-gray-600 text-sm  ml-1">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                            {/* Center Label */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-800">
                                        {pieData.reduce((sum, item) => sum + (item.value || 0), 0)}
                                    </p>
                                    <p className="text-xs text-gray-400">Total Items</p>
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
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <FiCalendar className="text-blue-500" />
                                Today's Deliveries
                            </h3>
                            <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                {todayDeliveryJobs.length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {jobsLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-40" />
                                        </div>
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                ))
                            ) : todayDeliveryJobs.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                    No deliveries scheduled for today
                                </div>
                            ) : (
                                todayDeliveryJobs.map(job => (
                                    <Link
                                        to={`/jobs?view=${job.jobId || job.id || job._id}`}
                                        key={job.id}
                                        className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-700 capitalize text-sm group-hover:text-blue-600 transition-colors">{job.customerName}</p>
                                            <p className="text-gray-400 text-xs mt-0.5 flex items-center gap-1">
                                                {job.device}
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                #{(job.jobId || job.id || job._id || '').toString().slice(-4)}
                                            </p>
                                        </div>
                                        <span className={`scale-90 origin-right capitalize status-badge ${getStatusClass(job.status)}`}>
                                            {job.status.replace('-', ' ')}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className="card p-6 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                <FiFileText className="text-blue-500" />
                                Recent Orders
                            </h3>
                            <Link to="/jobs" className="text-sm text-blue-600 hover:underline ">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {jobsLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-2">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-3 w-3/4" />
                                        </div>
                                    </div>
                                ))
                            ) : recentJobs.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-8">No recent activity.</p>
                            ) : (
                                recentJobs.map(job => (
                                    <div key={job.id} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors -mx-2">
                                        <div className="w-10 h-10 uppercase rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-sm font-bold border border-gray-200 shrink-0">
                                            {job.customerName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className="font-semibold text-gray-700 capitalize text-sm truncate">{job.customerName}</p>
                                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                                    {new Date(job.createdAt || Date.now()).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-gray-500 text-xs truncate pr-2">{job.device} - {job.issue?.slice(0, 20)}...</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize  ${getStatusClass(job.status).replace('border', '')}`}>
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
