import { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
    FiDollarSign, FiShoppingBag, FiTruck, FiTrendingUp, FiDownload,
    FiHome, FiUsers, FiPackage, FiActivity, FiCalendar
} from 'react-icons/fi';
import { BsCurrencyRupee } from 'react-icons/bs';
import api from '../api/client';
import StatCard from '../components/ui/StatCard';
import Select from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { utils, writeFile } from 'xlsx';

const Reports = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [period, setPeriod] = useState('year'); // 'year' or 'month'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const params = period === 'year'
                    ? { year }
                    : { year, month };
                const res = await api.get('/jobs/stats/reports', { params });
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [year, month, period]);

    const handleExport = () => {
        if (!data) return;

        const { monthlyStats, yearlyStats, deviceBreakdown, serviceTypeBreakdown } = data;

        // Prepare data for Excel
        const ws1Data = monthlyStats.map(row => ({
            'Month': row.month,
            'Orders Received': row.totalOrders,
            'Orders Delivered': row.deliveredOrders,
            'Walk-In': row.walkIn || 0,
            'Home Service': row.homeService || 0,
            'Revenue (₹)': row.revenue,
            'Outsource Cost (₹)': row.outsourceCost,
            'Net Profit (₹)': row.profit,
            'Completion Rate': row.totalOrders > 0 ? `${((row.deliveredOrders / row.totalOrders) * 100).toFixed(1)}%` : '0%'
        }));

        // Add yearly summary
        ws1Data.push({
            'Month': 'TOTAL',
            'Orders Received': yearlyStats.totalOrders,
            'Orders Delivered': yearlyStats.deliveredOrders,
            'Walk-In': yearlyStats.walkIn || 0,
            'Home Service': yearlyStats.homeService || 0,
            'Revenue (₹)': yearlyStats.revenue,
            'Outsource Cost (₹)': yearlyStats.outsourceCost,
            'Net Profit (₹)': yearlyStats.profit,
            'Completion Rate': yearlyStats.totalOrders > 0
                ? `${((yearlyStats.deliveredOrders / yearlyStats.totalOrders) * 100).toFixed(1)}%`
                : '0%'
        });

        const ws1 = utils.json_to_sheet(ws1Data);

        // Device breakdown sheet
        const ws2Data = deviceBreakdown?.map(item => ({
            'Device Type': item.name,
            'Count': item.value,
            'Percentage': `${((item.value / yearlyStats.totalOrders) * 100).toFixed(1)}%`
        })) || [];
        const ws2 = utils.json_to_sheet(ws2Data);

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws1, "Monthly Report");
        utils.book_append_sheet(wb, ws2, "Device Breakdown");

        writeFile(wb, `Business_Report_${year}.xlsx`);
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 min-[425px]:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="card p-6">
                            <Skeleton className="h-4 w-24 mb-4" />
                            <Skeleton className="h-8 w-20 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiActivity className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500">Failed to load reports data.</p>
            </div>
        );
    }

    const { monthlyStats, yearlyStats, deviceBreakdown, serviceTypeBreakdown, topCustomers } = data;

    const COLORS = ['#4361ee', '#3f37c9', '#4895ef', '#4cc9f0', '#f72585', '#b5179e'];

    const stats = [
        {
            title: 'Total Revenue',
            value: `₹${yearlyStats.revenue.toLocaleString()}`,
            label: 'Total income this year',
            icon: BsCurrencyRupee,
            color: 'bg-emerald-100 text-emerald-600',
            decorationColor: 'text-emerald-600',
            tooltip: 'Sum of all completed job amounts (totalAmount) for delivered orders in this period. This represents your gross income before expenses.'
        },
        {
            title: 'Outsource Cost',
            value: `₹${yearlyStats.outsourceCost.toLocaleString()}`,
            label: 'Paid to 3rd party vendors',
            icon: FiTrendingUp,
            color: 'bg-rose-100 text-rose-600',
            decorationColor: 'text-rose-600',
            tooltip: 'Total amount paid to external technicians/vendors for outsourced jobs. This is deducted from revenue to calculate net profit.'
        },
        {
            title: 'Net Profit',
            value: `₹${yearlyStats.profit.toLocaleString()}`,
            label: 'Revenue - Outsource Cost',
            icon: FiShoppingBag,
            color: 'bg-blue-100 text-blue-600',
            decorationColor: 'text-blue-600',
            tooltip: 'Your actual profit after deducting outsourcing costs. Formula: Total Revenue - Outsource Cost. This excludes other expenses like parts, rent, salaries, etc.'
        },
        {
            title: 'Orders Delivered',
            value: yearlyStats.deliveredOrders,
            label: `${yearlyStats.totalOrders} total orders received`,
            icon: FiTruck,
            color: 'bg-purple-100 text-purple-600',
            decorationColor: 'text-purple-600',
            tooltip: 'Number of orders successfully completed and delivered to customers. The total received count includes all orders regardless of status.'
        },
        {
            title: 'Walk-In Orders',
            value: yearlyStats.walkIn || 0,
            label: `${yearlyStats.homeService || 0} home service orders`,
            icon: FiPackage,
            color: 'bg-indigo-100 text-indigo-600',
            decorationColor: 'text-indigo-600',
            tooltip: 'Orders received at your shop/service center. Home Service orders are those where technicians visit customer locations.'
        },
        {
            title: 'Completion Rate',
            value: yearlyStats.totalOrders > 0
                ? `${((yearlyStats.deliveredOrders / yearlyStats.totalOrders) * 100).toFixed(1)}%`
                : '0%',
            label: 'Orders delivered vs received',
            icon: FiActivity,
            color: 'bg-cyan-100 text-cyan-600',
            decorationColor: 'text-cyan-600',
            tooltip: 'Percentage of received orders that have been successfully delivered. Formula: (Delivered Orders / Total Orders) × 100. Higher is better!'
        },
    ];

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Business Reports & Analytics</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Comprehensive insights for {period === 'year' ? year : `${months[month - 1]} ${year}`}
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Period Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setPeriod('year')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${period === 'year'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Yearly
                        </button>
                        <button
                            onClick={() => setPeriod('month')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${period === 'month'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            Monthly
                        </button>
                    </div>

                    {/* Month Selector (if monthly) */}
                    {period === 'month' && (
                        <Select
                            value={month}
                            onChange={(val) => setMonth(val)}
                            options={months.map((m, i) => ({ value: i + 1, label: m }))}
                            className="w-40"
                        />
                    )}

                    {/* Year Selector */}
                    <Select
                        value={year}
                        onChange={(val) => setYear(val)}
                        options={[
                            { value: 2024, label: '2024' },
                            { value: 2025, label: '2025' },
                            { value: 2026, label: '2026' },
                        ]}
                        className="w-32"
                    />

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="btn-primary flex items-center gap-2"
                    >
                        <FiDownload />
                        Export Excel
                    </button>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 min-[425px]:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} className="h-full" />
                ))}
            </div>

            {/* Charts Row 1: Financial + Volume */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Cost */}
                <div className="card p-6 flex flex-col h-[400px]">
                    <h3 className="font-bold text-gray-800 text-lg mb-6">Financial Performance</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend />
                                <Bar name="Revenue" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar name="Outsource Cost" dataKey="outsourceCost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                <Bar name="Profit" dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders Trend */}
                <div className="card p-6 flex flex-col h-[400px]">
                    <h3 className="font-bold text-gray-800 text-lg mb-6">Order Volume Trend</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyStats} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    name="Total Orders"
                                    dataKey="totalOrders"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorOrders)"
                                />
                                <Area
                                    type="monotone"
                                    name="Delivered"
                                    dataKey="deliveredOrders"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={0}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Device Breakdown + Service Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Device Category Breakdown */}
                <div className="card p-6 flex flex-col h-[400px]">
                    <h3 className="font-bold text-gray-800 text-lg mb-6">Device Category Distribution</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deviceBreakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {(deviceBreakdown || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Service Type Breakdown */}
                <div className="card p-6 flex flex-col h-[400px]">
                    <h3 className="font-bold text-gray-800 text-lg mb-6">Service Type Analysis</h3>
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="space-y-4">
                            {serviceTypeBreakdown && serviceTypeBreakdown.map((item, index) => {
                                const total = serviceTypeBreakdown.reduce((sum, i) => sum + i.value, 0);
                                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                                const color = index === 0 ? 'bg-blue-500' : 'bg-purple-500';

                                return (
                                    <div key={item.name} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {item.name === 'Walk-In' ? (
                                                    <FiPackage className="w-5 h-5 text-blue-600" />
                                                ) : (
                                                    <FiHome className="w-5 h-5 text-purple-600" />
                                                )}
                                                <span className="font-medium text-gray-800">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-500">{item.value} orders</span>
                                                <span className="font-bold text-gray-800 w-12 text-right">
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full ${color} rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Additional Stats */}
                        <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    ₹{yearlyStats.totalOrders > 0
                                        ? Math.round(yearlyStats.revenue / yearlyStats.totalOrders).toLocaleString()
                                        : 0}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-500 mb-1">Profit Margin</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    {yearlyStats.revenue > 0
                                        ? ((yearlyStats.profit / yearlyStats.revenue) * 100).toFixed(1)
                                        : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Monthly Breakdown Table */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-lg">Detailed Monthly Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs">
                            <tr>
                                <th className="px-6 py-4">Month</th>
                                <th className="px-6 py-4 text-right">Orders</th>
                                <th className="px-6 py-4 text-right">Delivered</th>
                                <th className="px-6 py-4 text-right">Walk-In</th>
                                <th className="px-6 py-4 text-right">Home Service</th>
                                <th className="px-6 py-4 text-right">Revenue</th>
                                <th className="px-6 py-4 text-right">3rd Party</th>
                                <th className="px-6 py-4 text-right">Profit</th>
                                <th className="px-6 py-4 text-right">Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {monthlyStats.map((row) => {
                                const completionRate = row.totalOrders > 0
                                    ? ((row.deliveredOrders / row.totalOrders) * 100).toFixed(1)
                                    : 0;

                                return (
                                    <tr key={row.month} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-800">{row.month}</td>
                                        <td className="px-6 py-4 text-right">{row.totalOrders}</td>
                                        <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                                            {row.deliveredOrders}
                                        </td>
                                        <td className="px-6 py-4 text-right">{row.walkIn || 0}</td>
                                        <td className="px-6 py-4 text-right">{row.homeService || 0}</td>
                                        <td className="px-6 py-4 text-right font-medium">
                                            ₹{row.revenue.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-rose-500">
                                            {row.outsourceCost > 0 ? `-₹${row.outsourceCost.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">
                                            ₹{row.profit.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${completionRate >= 80
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : completionRate >= 60
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {completionRate}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold text-gray-800">
                            <tr className="border-t-2 border-gray-200">
                                <td className="px-6 py-4">TOTAL</td>
                                <td className="px-6 py-4 text-right">{yearlyStats.totalOrders}</td>
                                <td className="px-6 py-4 text-right text-emerald-600">
                                    {yearlyStats.deliveredOrders}
                                </td>
                                <td className="px-6 py-4 text-right">{yearlyStats.walkIn || 0}</td>
                                <td className="px-6 py-4 text-right">{yearlyStats.homeService || 0}</td>
                                <td className="px-6 py-4 text-right">₹{yearlyStats.revenue.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-rose-600">
                                    -₹{yearlyStats.outsourceCost.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right text-blue-600">
                                    ₹{yearlyStats.profit.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                        {yearlyStats.totalOrders > 0
                                            ? ((yearlyStats.deliveredOrders / yearlyStats.totalOrders) * 100).toFixed(1)
                                            : 0}%
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Top Customers (if available) */}
            {topCustomers && topCustomers.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800 text-lg">Top Customers</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs">
                                <tr>
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4 text-right">Orders</th>
                                    <th className="px-6 py-4 text-right">Total Spent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {topCustomers.map((customer, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-800">#{index + 1}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-800 capitalize">{customer.name}</p>
                                                <p className="text-xs text-gray-500">{customer.phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-600">{customer.orders}</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                            ₹{customer.totalSpent.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
