import { useState, useMemo, useEffect } from 'react'; // Added useEffect
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { useJobs } from '../context/JobContext';
import api from '../api/client';
import { FiClock, FiFileText, FiCalendar, FiX, FiPackage, FiMapPin, FiUser, FiTool } from 'react-icons/fi';
import { BsCurrencyRupee } from "react-icons/bs";
import Select from '../components/ui/Select';
import StatCard from '../components/ui/StatCard';
import { Skeleton } from '../components/ui/Skeleton';

const OutsourceStats = () => {
    // const { loading: jobsLoading } = useJobs(); // Context doesn't have loading for this specific fetch
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
    const [viewActiveOnly, setViewActiveOnly] = useState(false);

    // Modal states
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [technicianOrders, setTechnicianOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

    useEffect(() => {
        const fetchOutsourcedJobs = async () => {
            setLoading(true);
            try {
                // Fetch all jobs that have been outsourced (have outsourced.name field)
                // regardless of their current status
                const { data } = await api.get('/jobs', {
                    params: {
                        hasOutsourced: true,
                        limit: 1000 // Reasonable limit for client-side stats
                    }
                });
                setJobs(data.jobs || []);
            } catch (error) {
                console.error("Failed to fetch outsourced jobs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOutsourcedJobs();
    }, []);

    // Filter jobs for the selected month
    const monthlyOutsourcedJobs = useMemo(() => {
        return jobs?.filter(job => {
            if (!job.outsourced || !job.outsourced.name) return false;
            // Use 'outsourced.date' or 'createdAt' if not present? 
            // The original logic used 'outsourced.date'.
            const dateStr = job.outsourced.date || job.updatedAt || job.createdAt;
            const d = new Date(dateStr);
            return d.getMonth() === parseInt(selectedMonth) && d.getFullYear() === new Date().getFullYear();
        });
    }, [jobs, selectedMonth]);

    // Aggregate stats by technician
    const technicianStats = useMemo(() => {
        const stats = {};

        monthlyOutsourcedJobs.forEach(job => {
            const name = job.outsourced.name;
            if (!stats[name]) {
                stats[name] = {
                    name,
                    totalJobs: 0,
                    activeJobs: 0,
                    totalCost: 0,
                    lastActive: null
                };
            }

            stats[name].totalJobs += 1;

            // Check if active: Status is 'outsourced'
            if (job.status === 'outsourced') {
                stats[name].activeJobs += 1;
            }

            const cost = parseFloat(job.outsourced.cost) || 0;
            stats[name].totalCost += cost;

            const dateStr = job.outsourced.date || job.updatedAt;
            const date = new Date(dateStr).getTime();
            if (!stats[name].lastActive || date > stats[name].lastActive) {
                stats[name].lastActive = date;
            }
        });

        return Object.values(stats);
    }, [monthlyOutsourcedJobs]);

    // Derived totals for the top cards (based on the selected month)
    const totalSpent = technicianStats.reduce((sum, tech) => sum + tech.totalCost, 0);
    const totalOutsourcedCount = technicianStats.reduce((sum, tech) => sum + tech.totalJobs, 0);
    const currentActiveOutsourced = technicianStats.reduce((sum, tech) => sum + tech.activeJobs, 0);

    // Prepare table data (filtered/sorted)
    const tableData = useMemo(() => {
        let data = [...technicianStats];
        if (viewActiveOnly) {
            data.sort((a, b) => b.activeJobs - a.activeJobs);
            data = data?.filter(t => t.activeJobs > 0);
        }
        return data;
    }, [technicianStats, viewActiveOnly]);

    // Handle technician click to show their orders
    const handleTechnicianClick = async (technicianName) => {
        setSelectedTechnician(technicianName);
        setShowOrdersModal(true);
        setLoadingOrders(true);

        try {
            // Filter jobs for this technician
            const orders = monthlyOutsourcedJobs.filter(job =>
                job.outsourced && job.outsourced.name === technicianName
            );
            setTechnicianOrders(orders);
        } catch (error) {
            console.error("Error filtering technician orders:", error);
            toast.error('Failed to load technician orders');
            setTechnicianOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    };

    // Handle order click to show details
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

    const closeOrderDetailsAndReopenList = () => {
        setShowOrderDetailModal(false);
        setShowOrdersModal(true);
    };


    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">3rd Party Statistics</h1>
                <p className="text-gray-500 text-sm mt-1">Overview of external technician performance and costs</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 min-[425px]:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Monthly Jobs Card */}
                {/* Monthly Jobs Card */}
                <div className="card p-4 h-full flex flex-col justify-between relative group">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 z-10">
                            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                <FiCalendar className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">{totalOutsourcedCount}</h3>
                        </div>
                    </div>

                    <div className="z-20 mt-2 flex items-center justify-between">
                        <p className="text-gray-500 text-sm ">Outsource in</p>
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
                            icon={BsCurrencyRupee}
                            color="bg-purple-100 text-purple-600"
                            decorationColor="text-purple-600"
                            className="h-full"
                        />

                        {/* Total Outsourced */}
                        <StatCard
                            value={totalOutsourcedCount}
                            label="Total Outsourced Orders"
                            icon={FiFileText}
                            color="bg-blue-100 text-[#4361ee]"
                            decorationColor="text-[#4361ee]"
                            className="h-full"
                        />

                        {/* Currently Active */}
                        <StatCard
                            value={currentActiveOutsourced}
                            label="Currently With 3rd Party"
                            icon={FiClock}
                            color="bg-orange-100 text-orange-600"
                            decorationColor="text-orange-600"
                            className={`h-full cursor-pointer ${viewActiveOnly ? 'border border-orange-400' : ''}`}
                            onClick={() => setViewActiveOnly(!viewActiveOnly)}
                        />
                    </>
                )}
            </div>

            {/* Technician Leaderboard */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Technician Overview</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Technician / Shop</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Total Orders</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Currently Active</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Total Paid</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Last Active</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
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
                            ) : tableData.length > 0 ? (
                                tableData.map((tech) => (
                                    <tr
                                        key={tech.name}
                                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                        onClick={() => handleTechnicianClick(tech.name)}
                                    >
                                        <td className="py-4 px-6  text-gray-800">{tech.name}</td>
                                        <td className="py-4 px-6 text-gray-600">{tech.totalJobs}</td>
                                        <td className="py-4 px-6">
                                            {tech.activeJobs > 0 ? (
                                                <span className="bg-orange-100 text-orange-700 py-1 px-2 rounded text-xs font-bold">
                                                    {tech.activeJobs} Active
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 font-bold text-gray-700">₹{tech.totalCost.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-right text-gray-500 text-sm">
                                            {tech.lastActive ? new Date(tech.lastActive).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">No outsourcing data available yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Technician Orders Modal */}
            {showOrdersModal && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Orders - {selectedTechnician}</h2>
                                <p className="text-sm text-gray-500 mt-1">Outsourced to this technician in {months[selectedMonth]}</p>
                            </div>
                            <button
                                onClick={() => setShowOrdersModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {loadingOrders ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="border border-gray-200 rounded-xl p-4">
                                            <Skeleton className="h-4 w-32 mb-2" />
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : technicianOrders.length > 0 ? (
                                <div className="space-y-3">
                                    {technicianOrders.map((order) => (
                                        <div
                                            key={order._id || order.id}
                                            onClick={() => {
                                                setShowOrdersModal(false);
                                                handleOrderClick(order);
                                            }}
                                            className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors">
                                                        #{order.jobId} - {order.customerName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{order.device}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'outsourced' ? 'bg-orange-100 text-orange-700' :
                                                        order.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {order.status.replace('-', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-gray-600">
                                                <span>Cost: ₹{order.outsourced?.cost?.toLocaleString() || '0'}</span>
                                                <span>{new Date(order.outsourced?.date || order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <FiFileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No orders found for this technician</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Order Detail Modal */}
            {showOrderDetailModal && selectedOrder && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
                                <p className="text-sm text-purple-600 font-semibold">#{selectedOrder.jobId}</p>
                            </div>
                            <button
                                onClick={closeOrderDetailsAndReopenList}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loadingOrderDetail ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-32 w-full" />
                                </div>
                            ) : (
                                <>
                                    {/* Customer Info */}
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <FiUser className="text-purple-600" />
                                            Customer Information
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Name:</span>
                                                <span className="font-medium text-gray-800">{selectedOrder.customerName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Phone:</span>
                                                <span className="font-medium text-gray-800">{selectedOrder.phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Device Info */}
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <FiPackage className="text-blue-600" />
                                            Device Information
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Device:</span>
                                                <span className="font-medium text-gray-800">{selectedOrder.device}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Issue:</span>
                                                <span className="font-medium text-gray-800">{selectedOrder.issue}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Status:</span>
                                                <span className="font-medium capitalize text-gray-800">{selectedOrder.status.replace('-', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Outsource Info */}
                                    {selectedOrder.outsourced && (
                                        <div className="border border-purple-200 bg-purple-50 rounded-xl p-4">
                                            <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                                                <FiTool />
                                                Outsource Information
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-purple-600">Vendor Name:</span>
                                                    <span className="font-semibold text-purple-900">{selectedOrder.outsourced.name}</span>
                                                </div>
                                                {selectedOrder.outsourced.phone && (
                                                    <div className="flex justify-between">
                                                        <span className="text-purple-600">Contact:</span>
                                                        <span className="font-semibold text-purple-900">{selectedOrder.outsourced.phone}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between">
                                                    <span className="text-purple-600">Cost Paid:</span>
                                                    <span className="font-semibold text-purple-900">₹{selectedOrder.outsourced.cost?.toLocaleString() || '0'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-purple-600">Outsourced On:</span>
                                                    <span className="font-semibold text-purple-900">
                                                        {selectedOrder.outsourced.date ? new Date(selectedOrder.outsourced.date).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Financials */}
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <BsCurrencyRupee className="text-green-600" />
                                            Payment Information
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <span className="text-gray-600 text-sm">Total Amount:</span>
                                                <span className="font-bold text-gray-800">₹{selectedOrder.totalAmount?.toLocaleString() || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <span className="text-gray-600 text-sm">Advance Paid:</span>
                                                <span className="font-semibold text-blue-600">₹{selectedOrder.advanceAmount?.toLocaleString() || 0}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-gray-600 text-sm font-semibold">Pending Amount:</span>
                                                <span className="font-bold text-amber-600 text-lg">₹{((selectedOrder.totalAmount || 0) - (selectedOrder.advanceAmount || 0))?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default OutsourceStats;
