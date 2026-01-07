import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { FiDollarSign, FiShoppingBag, FiTruck, FiTrendingUp, FiDownload } from 'react-icons/fi';
import api from '../api/client';
import StatCard from '../components/ui/StatCard';
import Select from '../components/ui/Select';

const Reports = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/jobs/stats/reports?year=${year}`);
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [year]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;
    if (!data) return <div className="p-8 text-center text-slate-500">Failed to load data.</div>;

    const { monthlyStats, yearlyStats } = data;

    const stats = [
        {
            title: 'Total Revenue',
            value: `₹${yearlyStats.revenue.toLocaleString()}`,
            label: 'Total income this year',
            icon: FiDollarSign,
            color: 'bg-emerald-100 text-emerald-600',
        },
        {
            title: 'Outsource Cost',
            value: `₹${yearlyStats.outsourceCost.toLocaleString()}`,
            label: 'Paid to 3rd party vendors',
            icon: FiTrendingUp,
            color: 'bg-rose-100 text-rose-600',
        },
        {
            title: 'Net Profit',
            value: `₹${yearlyStats.profit.toLocaleString()}`,
            label: 'Revenue - Outsource Cost',
            icon: FiShoppingBag,
            color: 'bg-blue-100 text-blue-600',
        },
        {
            title: 'Orders Delivered',
            value: yearlyStats.deliveredOrders,
            label: `${yearlyStats.totalOrders} total orders received`,
            icon: FiTruck,
            color: 'bg-purple-100 text-purple-600',
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Detailed Analytics</h1>
                    <p className="text-slate-500 text-sm mt-1">Performance report for {year}</p>
                </div>
                <div className="flex items-center gap-3">
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
                    <button className="btn-secondary flex items-center gap-2" title="Export (Coming Soon)">
                        <FiDownload /> Export
                    </button>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Cost */}
                <div className="card p-6 flex flex-col h-[400px]">
                    <h3 className="font-bold text-slate-800 text-lg mb-6">Financial Overview</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
                    <h3 className="font-bold text-slate-800 text-lg mb-6">Order Volume</h3>
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
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" name="Total Orders" dataKey="totalOrders" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" />
                                <Area type="monotone" name="Delivered" dataKey="deliveredOrders" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-lg">Monthly Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs">
                            <tr>
                                <th className="px-6 py-4">Month</th>
                                <th className="px-6 py-4 text-right">Orders Rec.</th>
                                <th className="px-6 py-4 text-right">Orders Del.</th>
                                <th className="px-6 py-4 text-right">Revenue</th>
                                <th className="px-6 py-4 text-right">3rd Party Cost</th>
                                <th className="px-6 py-4 text-right">Net Profit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {monthlyStats.map((row) => (
                                <tr key={row.month} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-medium text-slate-800">{row.month}</td>
                                    <td className="px-6 py-4 text-right">{row.totalOrders}</td>
                                    <td className="px-6 py-4 text-right text-emerald-600">{row.deliveredOrders}</td>
                                    <td className="px-6 py-4 text-right font-medium">₹{row.revenue.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-rose-500">
                                        {row.outsourceCost > 0 ? `-₹${row.outsourceCost.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-600">₹{row.profit.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold text-slate-800">
                            <tr>
                                <td className="px-6 py-4">Total</td>
                                <td className="px-6 py-4 text-right">{yearlyStats.totalOrders}</td>
                                <td className="px-6 py-4 text-right">{yearlyStats.deliveredOrders}</td>
                                <td className="px-6 py-4 text-right">₹{yearlyStats.revenue.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-rose-600">-₹{yearlyStats.outsourceCost.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-blue-600">₹{yearlyStats.profit.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
