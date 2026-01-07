import { useState, useEffect } from 'react';
import { useJobs } from '../context/JobContext';
import api from '../api/client';
import { FiTrendingUp, FiTool, FiClock, FiExternalLink, FiCalendar } from 'react-icons/fi';
import { MdOutlineCurrencyRupee } from 'react-icons/md';
import Select from '../components/ui/Select';
import StatCard from '../components/ui/StatCard';
import { Skeleton } from '../components/ui/Skeleton';

const OutsourceStats = () => {
    const { jobs } = useJobs();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/jobs/stats/outsource');
                setTechnicians(data);
            } catch (error) {
                console.error("Failed to fetch outsource stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Monthly Logic (Using Context for immediate time-filtering)
    const outsourcedJobs = jobs.filter(job => job.outsourced && job.outsourced.name);

    // Derived from API Data
    const totalSpent = technicians.reduce((sum, tech) => sum + (tech.totalCost || 0), 0);
    const totalOutsourcedCount = technicians.reduce((sum, tech) => sum + (tech.totalJobs || 0), 0);
    const currentActiveOutsourced = technicians.reduce((sum, tech) => sum + (tech.activeJobs || 0), 0);

    // Monthly Logic
    const monthlyJobCount = outsourcedJobs.filter(job => {
        const d = new Date(job.outsourced.date);
        return d.getMonth() === parseInt(selectedMonth) && d.getFullYear() === new Date().getFullYear();
    }).length;

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">3rd Party Statistics</h1>
                <p className="text-slate-500 text-sm mt-1">Overview of external technician performance and costs</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Monthly Jobs Card */}
                <div className="card p-6 h-40 flex flex-col justify-between relative overflow-visible group">
                    <div className="flex justify-between items-start z-20">
                        <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                            <FiCalendar className="w-6 h-6" />
                        </div>
                        <div className="w-30">
                            <Select
                                value={selectedMonth}
                                onChange={(val) => setSelectedMonth(val)}
                                options={months.map((m, i) => ({ label: m, value: i }))}
                                triggerClassName="
    border-none bg-transparent shadow-none p-0 h-auto justify-end gap-2
    text-slate-500 hover:text-indigo-600
    focus:outline-none focus:ring-0 focus:ring-offset-0
    focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
  "
                                className="min-w-[100px]"
                            />

                        </div>
                    </div>

                    <div className="z-10">
                        <h3 className="text-3xl font-bold text-slate-800 mb-1">{monthlyJobCount}</h3>
                        <p className="text-slate-500 text-sm font-medium">Outsource Orders in {months[selectedMonth]}</p>
                    </div>

                    {/* Hover effect decoration container */}
                    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-0">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-600 opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                    </div>
                </div>

                {/* Total Expenditure */}
                {/* Total Expenditure */}
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card p-6 flex justify-between items-start">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <Skeleton className="h-10 w-10 rounded-lg" />
                        </div>
                    ))
                ) : (
                    <>
                        {/* Total Expenditure */}
                        <StatCard
                            value={`₹${totalSpent.toLocaleString()}`}
                            label="Total Expenditure"
                            icon={MdOutlineCurrencyRupee}
                            color="bg-purple-100 text-purple-600"
                            decorationColor="text-purple-600"
                        />

                        {/* Total Outsourced */}
                        <StatCard
                            value={totalOutsourcedCount}
                            label="Total Outsourced Orders"
                            icon={FiTool}
                            color="bg-blue-100 text-[#4361ee]"
                            decorationColor="text-[#4361ee]"
                        />

                        {/* Currently Active */}
                        <StatCard
                            value={currentActiveOutsourced}
                            label="Currently With 3rd Party"
                            icon={FiClock}
                            color="bg-orange-100 text-orange-600"
                            decorationColor="text-orange-600"
                        />
                    </>
                )}
            </div>

            {/* Technician Leaderboard */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Technician Overview</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Technician / Shop</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Total Orders</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Currently Active</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Total Paid</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="py-4 px-6"><Skeleton className="h-4 w-32" /></td>
                                        <td className="py-4 px-6"><Skeleton className="h-4 w-12" /></td>
                                        <td className="py-4 px-6"><Skeleton className="h-6 w-20 rounded" /></td>
                                        <td className="py-4 px-6"><Skeleton className="h-4 w-20" /></td>
                                        <td className="py-4 px-6"><Skeleton className="h-4 w-24 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : technicians.length > 0 ? (
                                technicians.map((tech) => (
                                    <tr key={tech.name} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-slate-800">{tech.name}</td>
                                        <td className="py-4 px-6 text-slate-600">{tech.totalJobs}</td>
                                        <td className="py-4 px-6">
                                            {tech.activeJobs > 0 ? (
                                                <span className="bg-orange-100 text-orange-700 py-1 px-2 rounded text-xs font-bold">
                                                    {tech.activeJobs} Active
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-slate-700">₹{tech.totalCost.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-right text-slate-500 text-sm">
                                            {tech.lastActive ? new Date(tech.lastActive).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-slate-500">No outsourcing data available yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OutsourceStats;
