import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useJobs } from '../context/JobContext';
import { FiPhone, FiFileText, FiCalendar, FiTrendingUp, FiGrid, FiList, FiDownload, FiSearch, FiX, FiPackage, FiDollarSign, FiClock, FiMapPin, FiUser, FiTool } from 'react-icons/fi';
import { Skeleton } from '../components/ui/Skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { utils, writeFile } from 'xlsx';
import api from '../api/client';
import { BiRupee } from 'react-icons/bi';

const Customers = () => {
    const { stats } = useJobs();
    const [customers, setCustomers] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true); // Start with true for initial load
    const [hasMore, setHasMore] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const navigate = useNavigate();

    // Modal states
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOrders, setCustomerOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

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
            toast.error('Failed to load customers');
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
            toast.error('Failed to export data');
            return;
        }
        toast.success('Client directory exported successfully');
    };

    const handleCustomerClick = async (customer) => {
        setSelectedCustomer(customer);
        setShowOrdersModal(true);
        setLoadingOrders(true);

        try {
            const { data } = await api.get('/jobs', {
                params: {
                    search: customer.phone,
                    limit: 100
                }
            });
            setCustomerOrders(data.jobs || []);
        } catch (error) {
            console.error("Error fetching customer orders:", error);
            setCustomerOrders([]);
            toast.error('Failed to load customer orders');
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleOrderClick = async (order) => {
        setLoadingOrderDetail(true);
        setShowOrderDetailModal(true);

        try {
            const { data } = await api.get(`/jobs/${order.jobId || order.id || order._id}`);
            setSelectedOrder(data);
        } catch (error) {
            console.error("Error fetching order details:", error);
            setSelectedOrder(order);
            toast.error('Failed to load order details');
        } finally {
            setLoadingOrderDetail(false);
        }
    };

    const closeOrdersModal = () => {
        setShowOrdersModal(false);
        setSelectedCustomer(null);
        setCustomerOrders([]);
        // Also close order detail if it's open
        setShowOrderDetailModal(false);
        setSelectedOrder(null);
    };

    const closeOrderDetailModal = () => {
        setShowOrderDetailModal(false);
        setSelectedOrder(null);
        // Don't close the orders modal - keep it open
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
            'ready': 'bg-purple-100 text-purple-700 border-purple-200',
            'delivered': 'bg-green-100 text-green-700 border-green-200',
            'cancelled': 'bg-red-100 text-red-700 border-red-200'
        };
        return statusClasses[status] || 'bg-gray-100 text-gray-700 border-gray-200';
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
                                        onClick={() => handleCustomerClick(customer)}
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
                                onClick={() => handleCustomerClick(customer)}
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

            {/* Orders Modal */}
            {showOrdersModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeOrdersModal}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 capitalize">
                                    {selectedCustomer?.name}'s Orders
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    <FiPhone className="inline w-3 h-3 mr-1" />
                                    {selectedCustomer?.phone}
                                </p>
                            </div>
                            <button
                                onClick={closeOrdersModal}
                                className="p-2 hover:bg-white rounded-full transition-colors"
                            >
                                <FiX className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Customer Stats */}
                        <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-800">{selectedCustomer?.totalJobs || 0}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Spent</p>
                                <p className="text-2xl font-bold text-emerald-600">₹{selectedCustomer?.totalSpent?.toLocaleString() || 0}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Pending</p>
                                <p className="text-2xl font-bold text-amber-600">₹{selectedCustomer?.pendingAmount?.toLocaleString() || 0}</p>
                            </div>
                        </div>

                        {/* Orders List */}
                        <div className="p-6 overflow-y-auto max-h-[50vh]">
                            {loadingOrders ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="border border-gray-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between">
                                                <Skeleton className="h-5 w-24" />
                                                <Skeleton className="h-6 w-20" />
                                            </div>
                                            <Skeleton className="h-4 w-full mt-3" />
                                            <Skeleton className="h-4 w-2/3 mt-2" />
                                        </div>
                                    ))}
                                </div>
                            ) : customerOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-400 text-lg">No orders found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {customerOrders.map((order) => (
                                        <div
                                            key={order._id}
                                            onClick={() => handleOrderClick(order)}
                                            className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-bold text-gray-800 text-lg">#{order.jobId}</span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm line-clamp-1">
                                                        <FiTool className="inline w-3 h-3 mr-1" />
                                                        {order.deviceType} - {order.brand} {order.model}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-gray-800">₹{order.totalAmount || 0}</p>
                                                    {(order.totalAmount - order.advanceAmount) > 0 && (
                                                        <p className="text-xs text-amber-600 font-semibold">Due: ₹{(order.totalAmount - order.advanceAmount)}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                                                <span className="flex items-center gap-1">
                                                    <FiCalendar className="w-3 h-3" />
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </span>
                                                {order.issue && (
                                                    <span className="flex-1 truncate">
                                                        {order.issue}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Order Detail Modal */}
            {showOrderDetailModal && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={closeOrderDetailModal}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Order Details</h2>
                                {selectedOrder && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Job ID: <span className="font-semibold">#{selectedOrder.jobId}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={closeOrderDetailModal}
                                className="p-2 hover:bg-white rounded-full transition-colors"
                            >
                                <FiX className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Order Details Content */}
                        <div className="p-6 overflow-y-auto max-h-[75vh]">
                            {loadingOrderDetail ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i}>
                                            <Skeleton className="h-4 w-24 mb-2" />
                                            <Skeleton className="h-6 w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : selectedOrder ? (
                                <div className="space-y-6">
                                    {/* Status */}
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <span className="text-sm font-semibold text-gray-600">Status</span>
                                        <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getStatusBadgeClass(selectedOrder.status)}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>

                                    {/* Customer Information */}
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <FiUser className="w-5 h-5 text-blue-600" />
                                            Customer Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-500 mb-1">Name</p>
                                                <p className="font-semibold text-gray-800 capitalize">{selectedOrder.customerName}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Phone</p>
                                                <p className="font-semibold text-gray-800">{selectedOrder.phone}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Device Information */}
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <FiTool className="w-5 h-5 text-purple-600" />
                                            Device Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-500 mb-1">Device Type</p>
                                                <p className="font-semibold text-gray-800">{selectedOrder.deviceType}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Brand</p>
                                                <p className="font-semibold text-gray-800">{selectedOrder.brand}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 mb-1">Model</p>
                                                <p className="font-semibold text-gray-800">{selectedOrder.model}</p>
                                            </div>
                                            {selectedOrder.imei && (
                                                <div>
                                                    <p className="text-gray-500 mb-1">IMEI/Serial</p>
                                                    <p className="font-semibold text-gray-800">{selectedOrder.imei}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Issue & Solution */}
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <h3 className="font-bold text-gray-800 mb-3">Issue Description</h3>
                                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{selectedOrder.issue || 'N/A'}</p>

                                        {selectedOrder.solution && (
                                            <>
                                                <h3 className="font-bold text-gray-800 mb-3 mt-4">Solution</h3>
                                                <p className="text-gray-600 text-sm bg-green-50 p-3 rounded-lg">{selectedOrder.solution}</p>
                                            </>
                                        )}
                                    </div>

                                    {/* Service Type & Address */}
                                    {selectedOrder.type === 'home-service' && (
                                        <div className="border border-gray-200 rounded-xl p-4">
                                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <FiMapPin className="w-5 h-5 text-red-600" />
                                                Home Service Details
                                            </h3>
                                            <div className="space-y-3 text-sm">
                                                {selectedOrder.address && (
                                                    <div>
                                                        <p className="text-gray-500 mb-1">Address</p>
                                                        <p className="font-semibold text-gray-800">{selectedOrder.address}</p>
                                                    </div>
                                                )}
                                                {selectedOrder.visitDate && (
                                                    <div>
                                                        <p className="text-gray-500 mb-1">Visit Date</p>
                                                        <p className="font-semibold text-gray-800">
                                                            {new Date(selectedOrder.visitDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Information */}
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <BiRupee className="w-5 h-5 text-emerald-600" />
                                            Payment Information
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <span className="text-gray-600 text-sm">Total Cost</span>
                                                <span className="font-bold text-gray-800">₹{selectedOrder.totalAmount?.toLocaleString() || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <span className="text-gray-600 text-sm">Advance Paid</span>
                                                <span className="font-semibold text-blue-600">₹{selectedOrder.advanceAmount?.toLocaleString() || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-gray-600 text-sm font-semibold">Pending Amount</span>
                                                <span className="font-bold text-amber-600 text-lg">₹{((selectedOrder.totalAmount || 0) - (selectedOrder.advanceAmount || 0))?.toLocaleString()}</span>
                                            </div>
                                            {(() => {
                                                let breakdownData = selectedOrder.paymentBreakdown;

                                                // If no structured breakdown, try to parse from note
                                                if ((!breakdownData || breakdownData.length === 0) && selectedOrder.note && selectedOrder.note.includes('Breakdown:')) {
                                                    const breakdownMatch = selectedOrder.note.match(/Breakdown:\s*(.+?)\s*\(Total:/);
                                                    if (breakdownMatch) {
                                                        const itemsString = breakdownMatch[1];
                                                        const items = itemsString.split(',').map(item => {
                                                            const parts = item.trim().split(/:\s*₹/);
                                                            if (parts.length === 2) {
                                                                return {
                                                                    description: parts[0].trim(),
                                                                    amount: parseFloat(parts[1].replace(/,/g, '')) || 0
                                                                };
                                                            }
                                                            return null;
                                                        }).filter(item => item !== null);

                                                        if (items.length > 0) {
                                                            breakdownData = items;
                                                        }
                                                    }
                                                }

                                                return breakdownData && Array.isArray(breakdownData) && breakdownData.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <p className="text-gray-500 text-xs mb-2 font-semibold">Payment Breakdown</p>
                                                        <div className="bg-blue-50 rounded-lg overflow-hidden">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-blue-100">
                                                                    <tr>
                                                                        <th className="text-left py-2 px-3 text-gray-700 font-semibold">Description</th>
                                                                        <th className="text-right py-2 px-3 text-gray-700 font-semibold">Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {breakdownData.map((item, index) => (
                                                                        <tr key={index} className="border-t border-blue-200">
                                                                            <td className="py-2 px-3 text-gray-700">{item.description}</td>
                                                                            <td className="text-right py-2 px-3 font-semibold text-gray-800">₹{item.amount?.toLocaleString()}</td>
                                                                        </tr>
                                                                    ))}
                                                                    <tr className="border-t-2 border-blue-300 bg-blue-200/50">
                                                                        <td className="py-2 px-3 font-bold text-gray-800">Total</td>
                                                                        <td className="text-right py-2 px-3 font-bold text-gray-800">
                                                                            ₹{breakdownData.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <FiClock className="w-5 h-5 text-indigo-600" />
                                            Timeline
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-500 mb-1">Created Date</p>
                                                <p className="font-semibold text-gray-800">
                                                    {new Date(selectedOrder.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {selectedOrder.estimatedDelivery && (
                                                <div>
                                                    <p className="text-gray-500 mb-1">Expected Delivery</p>
                                                    <p className="font-semibold text-gray-800">
                                                        {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedOrder.deliveryDate && (
                                                <div>
                                                    <p className="text-gray-500 mb-1">Delivered On</p>
                                                    <p className="font-semibold text-green-600">
                                                        {new Date(selectedOrder.deliveryDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Outsource Information */}
                                    {selectedOrder.outsourced && (
                                        <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
                                            <h3 className="font-bold text-purple-800 mb-3">3rd Party Outsource Details</h3>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                {selectedOrder.outsourced.name && (
                                                    <div>
                                                        <p className="text-purple-600 mb-1">Vendor Name</p>
                                                        <p className="font-semibold text-gray-800">{selectedOrder.outsourced.name}</p>
                                                    </div>
                                                )}
                                                {selectedOrder.outsourced.phone && (
                                                    <div>
                                                        <p className="text-purple-600 mb-1">Contact</p>
                                                        <p className="font-semibold text-gray-800">{selectedOrder.outsourced.phone}</p>
                                                    </div>
                                                )}
                                                {selectedOrder.outsourced.cost !== undefined && (
                                                    <div>
                                                        <p className="text-purple-600 mb-1">Cost Paid</p>
                                                        <p className="font-semibold text-gray-800">₹{selectedOrder.outsourced.cost}</p>
                                                    </div>
                                                )}
                                                {selectedOrder.outsourced.date && (
                                                    <div>
                                                        <p className="text-purple-600 mb-1">Outsourced On</p>
                                                        <p className="font-semibold text-gray-800">
                                                            {new Date(selectedOrder.outsourced.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {selectedOrder.note && (
                                        <div className="border border-gray-200 rounded-xl p-4">
                                            <h3 className="font-bold text-gray-800 mb-3">Additional Notes</h3>
                                            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{selectedOrder.note}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-gray-400">Order details not available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Customers;
