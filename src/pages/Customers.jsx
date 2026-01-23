import { useState, useEffect, useCallback, useRef } from 'react';
import { useJobs } from '../context/JobContext';
import { FiPhone, FiFileText, FiCalendar, FiTrendingUp, FiGrid, FiList, FiDownload, FiSearch } from 'react-icons/fi';
import { Skeleton } from '../components/ui/Skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';
import api from '../api/client';

const Customers = () => {
    const { stats } = useJobs();
    const [customers, setCustomers] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true); // Start with true for initial load
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const navigate = useNavigate();

    // Search input state
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Reset pagination when search changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
    }, [debouncedSearch]);

    const fetchCustomers = useCallback(async () => {
        if (!hasMore && page > 1) return;

        setLoading(true);
        try {
            const { data } = await api.get('/customers', {
                params: {
                    page,
                    limit: 12,
                    search: debouncedSearch
                }
            });

            if (data.customers.length === 0) {
                setCustomers(page === 1 ? [] : prev => prev);
                setHasMore(false);
            } else {
                setCustomers(prev => page === 1 ? data.customers : [...prev, ...data.customers]);
                if (data.customers.length < 12) setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, hasMore]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Infinite Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && hasMore && !loading) {
                setPage(prev => prev + 1);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, loading]);


    const handleExportExcel = async () => {
        try {
            // Fetch all customers for export
            const { data } = await api.get('/customers', { params: { limit: 10000, search } });
            const exportData = data.customers.map(customer => ({
                'Customer Name': customer.name,
                'Phone Number': customer.phone,
                'Total Jobs': customer.totalJobs,
                'Total Spent (₹)': customer.totalSpent,
                'Pending Amount (₹)': customer.pendingAmount,
                'Last Visit': customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'N/A'
            }));

            const ws = utils.json_to_sheet(exportData);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, "Client Directory");
            writeFile(wb, "Client_Directory.xlsx");
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export data");
        }
    };

    const handleCustomerClick = (phone) => {
        navigate(`/jobs?search=${phone}`);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage client database & history</p>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 min-[425px]:grid-cols-2 md:grid-cols-3 gap-6">
                {!stats ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`card p-6 flex justify-between items-center ${i === 2 ? 'col-span-1 min-[425px]:col-span-2 md:col-span-1' : ''}`}>
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
                                <p className="text-gray-500 text-sm mb-1">Total Customers</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.totalCustomers || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                <FiPhone className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="card p-6 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Total Jobs</p>
                                <p className="text-3xl font-bold text-gray-800">{stats.total || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                <FiFileText className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="card p-6 flex items-center justify-between col-span-1 min-[425px]:col-span-2 md:col-span-1">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Engagement</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {(stats.totalCustomers > 0 ? (stats.total / stats.totalCustomers) : 0).toFixed(1)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                <FiTrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Customer Directory */}
            <div className="card p-6 min-h-[500px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">Client Directory</h3>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-64">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            {/* Export Button */}
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-100 whitespace-nowrap"
                                title="Export to Excel"
                            >
                                <FiDownload />
                                <span className="hidden min-[450px]:inline">Export</span>
                            </button>

                            {/* View Toggle */}
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Table View"
                                >
                                    <FiList className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Grid View"
                                >
                                    <FiGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Jobs</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Spent</th>
                                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Visit</th>
                                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customers.map((customer) => (
                                    <tr
                                        key={customer._id}
                                        onClick={() => handleCustomerClick(customer.phone)}
                                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold group-hover:bg-[#4361ee] group-hover:text-white transition-colors text-sm">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-gray-800 capitalize">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-gray-600 text-sm font-medium">{customer.phone}</td>
                                        <td className="py-4 px-6 text-gray-600 text-sm">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-medium">
                                                {customer.totalJobs} Jobs
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-800 font-semibold text-sm">
                                            ₹{customer.totalSpent?.toLocaleString() || 0}
                                        </td>
                                        <td className="py-4 px-6 text-gray-500 text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <FiCalendar className="w-3.5 h-3.5" />
                                                {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {customer.pendingAmount > 0 ? (
                                                <Link
                                                    to={`/jobs?search=${customer.phone}&filter=all`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 hover:bg-amber-100 transition-colors text-xs font-bold"
                                                >
                                                    Due: ₹{customer.pendingAmount}
                                                </Link>
                                            ) : (
                                                <span className="inline-flex items-center text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium">
                                                    All Paid
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customers.map((customer) => (
                            <div
                                key={customer._id}
                                onClick={() => handleCustomerClick(customer.phone)}
                                className="group border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 capitalize flex items-center justify-center text-gray-600 font-bold group-hover:bg-[#4361ee] group-hover:text-white transition-colors">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 capitalize">{customer.name}</h4>
                                            <p className="text-gray-500 text-xs">{customer.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Jobs</p>
                                        <p className="text-gray-800 font-bold">{customer.totalJobs}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Spent</p>
                                        <p className="text-gray-800 font-bold">₹{customer.totalSpent?.toLocaleString() || 0}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                                    <span className="text-gray-400 flex items-center gap-1">
                                        <FiCalendar className="w-3 h-3" />
                                        {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'N/A'}
                                    </span>
                                    {customer.pendingAmount > 0 ? (
                                        <Link
                                            to={`/jobs?search=${customer.phone}&filter=all`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-2 group/pay"
                                            title="View orders to collect payment"
                                        >
                                            <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 group-hover/pay:bg-amber-100 transition-colors">
                                                Due: ₹{customer.pendingAmount}
                                            </span>
                                        </Link>
                                    ) : (
                                        <span className="text-emerald-500 text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">
                                            All Paid
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className={`mt-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}`}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            viewMode === 'table' ? (
                                <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            ) : (
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
                            )
                        ))}
                    </div>
                )}

                {!loading && customers.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No customers found</p>
                    </div>
                )}

                {!hasMore && customers.length > 0 && (
                    <div className="text-center py-6 text-xs text-gray-400 uppercase tracking-widest">
                        End of List
                    </div>
                )}
            </div>
        </div>
    );
};

export default Customers;
