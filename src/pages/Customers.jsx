import { useJobs } from '../context/JobContext';
import { FiPhone, FiFileText, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { Skeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';

const Customers = () => {
    const { customers, jobs, loading } = useJobs();

    const getCustomerJobs = (phone) => {
        return jobs.filter(job => job.phone === phone);
    };

    const getCustomerStats = (phone) => {
        const customerJobs = getCustomerJobs(phone);
        const totalSpent = customerJobs.reduce((sum, job) => sum + (parseFloat(job.totalAmount) || 0), 0);
        const pendingAmount = customerJobs
            .filter(job => job.status !== 'delivered')
            .reduce((sum, job) => sum + ((parseFloat(job.totalAmount) || 0) - (parseFloat(job.advanceAmount) || 0)), 0);

        return {
            totalJobs: customerJobs.length,
            totalSpent,
            pendingAmount,
            lastVisit: customerJobs.length > 0
                ? new Date(Math.max(...customerJobs.map(j => new Date(j.createdAt)))).toLocaleDateString()
                : 'N/A',
        };
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage client database & history</p>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card p-6 flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-12" />
                            </div>
                            <Skeleton className="h-12 w-12 rounded-full" />
                        </div>
                    ))
                ) : (
                    <>
                        <div className="card p-6 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-1">Total Customers</p>
                                <p className="text-3xl font-bold text-gray-800">{customers.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                <FiPhone className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="card p-6 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-1">Active Jobs</p>
                                <p className="text-3xl font-bold text-gray-800">{jobs.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                <FiFileText className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="card p-6 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm font-medium mb-1">Engagement</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {customers.length > 0 ? (jobs.length / customers.length).toFixed(1) : 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                <FiTrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Customer Grid */}
            <div className="card p-6">
                <h3 className="font-bold text-gray-800 text-lg mb-6">Client Directory</h3>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="border border-gray-200 rounded-xl p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Skeleton className="h-10 rounded-lg" />
                                    <Skeleton className="h-10 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customers.map((customer) => {
                            const stats = getCustomerStats(customer.phone);
                            return (
                                <div
                                    key={customer.id}
                                    className="group border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-300 bg-white"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold group-hover:bg-[#4361ee] group-hover:text-white transition-colors">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{customer.name}</h4>
                                                <p className="text-gray-500 text-xs">{customer.phone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-gray-50 rounded-lg p-2.5">
                                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Jobs</p>
                                            <p className="text-gray-800 font-bold">{stats.totalJobs}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-2.5">
                                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Spent</p>
                                            <p className="text-gray-800 font-bold">₹{stats.totalSpent.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                                        <span className="text-gray-400 flex items-center gap-1">
                                            <FiCalendar className="w-3 h-3" />
                                            {stats.lastVisit}
                                        </span>
                                        {stats.pendingAmount > 0 ? (
                                            <Link
                                                to={`/jobs?search=${customer.phone}&filter=all`}
                                                className="flex items-center gap-2 group/pay"
                                                title="View orders to collect payment"
                                            >
                                                <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 group-hover/pay:bg-amber-100 transition-colors">
                                                    Due: ₹{stats.pendingAmount}
                                                </span>
                                            </Link>
                                        ) : (
                                            <span className="text-emerald-500 font-medium text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">
                                                All Paid
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {customers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No customers found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Customers;
