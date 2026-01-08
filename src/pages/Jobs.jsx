import { useEffect, useState, useRef } from 'react';
import { useJobs } from '../context/JobContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import CreatableSelect from '../components/ui/CreatableSelect';
import Select from '../components/ui/Select';
import api from '../api/client';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiFilter, FiSearch, FiExternalLink, FiCheckSquare, FiEye } from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';

const DEVICE_CATEGORIES = {
    Mobile: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Motorola'],
    Laptop: ['HP', 'Dell', 'Lenovo', 'Acer', 'Asus', 'Apple', 'MSI', 'Microsoft'],
    CCTV: ['Hikvision', 'CP Plus', 'Dahua', 'Honeywell'],
    Printer: ['HP', 'Canon', 'Epson', 'Brother'],
    Other: []
};

const Jobs = () => {
    const { jobs, addJob, updateJob, deleteJob, loading } = useJobs();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);

        // Handle 'New Order' action
        if (searchParams.get('action') === 'new') {
            setEditingJob(null);
            setShowForm(true);
            navigate('/jobs', { replace: true });
        }

        // Handle search query from Customers page
        const searchParam = searchParams.get('search');
        if (searchParam) {
            setSearchTerm(searchParam);
        }

        // Handle 'View Job' action
        const viewJobId = searchParams.get('view');
        if (viewJobId) {
            const jobToView = jobs.find(j => (j.jobId || j.id || j._id) === viewJobId);
            if (jobToView) {
                setViewJob(jobToView);
                setShowViewModal(true);
                // Optional: Clean URL
                // navigate('/jobs', { replace: true });
            }
        }
    }, [location, navigate, jobs]);

    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [showOutsourceModal, setShowOutsourceModal] = useState(false);
    const [outsourcingJob, setOutsourcingJob] = useState(null);
    const [outsourceData, setOutsourceData] = useState({ name: '', phone: '', cost: '' });
    const [vendors, setVendors] = useState([]);
    const costInputRef = useRef(null);

    useEffect(() => {
        if (showOutsourceModal) {
            api.get('/vendors')
                .then(res => setVendors(res.data))
                .catch(err => console.error('Failed to fetch vendors', err));
        }
    }, [showOutsourceModal]);

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentJob, setPaymentJob] = useState(null);
    const [paymentData, setPaymentData] = useState({
        type: 'full', // 'full' or 'discount'
        discountAmount: '',
        finalAmount: ''
    });

    const handlePayment = (job) => {
        const balance = (parseFloat(job.totalAmount) || 0) - (parseFloat(job.advanceAmount) || 0);
        setPaymentJob(job);
        setPaymentData({
            type: 'full',
            discountAmount: '',
            finalAmount: balance
        });
        setShowPaymentModal(true);
    };

    const submitPayment = (e) => {
        e.preventDefault();
        if (!paymentJob) return;

        const currentTotal = parseFloat(paymentJob.totalAmount) || 0;
        let newTotal = currentTotal;
        let newAdvance = currentTotal; // By default, full payment means Advance becomes Total

        if (paymentData.type === 'discount') {
            const discount = parseFloat(paymentData.discountAmount) || 0;
            newTotal = currentTotal - discount;
            newAdvance = newTotal; // Fully paid after discount
        }

        updateJob(paymentJob.jobId || paymentJob.id, {
            ...paymentJob,
            status: 'delivered',
            totalAmount: newTotal,
            advanceAmount: newAdvance
        });

        setShowPaymentModal(false);
        setPaymentJob(null);
    };

    // Receive Back State
    const [showReceiveModal, setShowReceiveModal] = useState(false);
    const [receivingJob, setReceivingJob] = useState(null);
    const [receiveData, setReceiveData] = useState({ status: 'ready', cost: '' });

    // View Details State
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewJob, setViewJob] = useState(null);

    // Update viewJob when jobs list changes (to show real-time history updates)
    useEffect(() => {
        if (viewJob && showViewModal) {
            const updatedJob = jobs.find(j => (j.jobId || j.id || j._id) === (viewJob.jobId || viewJob.id || viewJob._id));
            if (updatedJob) {
                // If updatedJob has more history items or different status, update viewJob
                if (updatedJob.status !== viewJob.status ||
                    (updatedJob.statusHistory && viewJob.statusHistory && updatedJob.statusHistory.length !== viewJob.statusHistory.length)) {
                    setViewJob(updatedJob);
                }
            }
        }
    }, [jobs, showViewModal, viewJob]);

    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        deviceType: '',
        brand: '',
        model: '',
        device: '', // Legacy/Display field
        issue: '',
        receivedDate: new Date().toISOString().split('T')[0],
        estimatedDelivery: '',
        technician: '',
        advanceAmount: '',
        totalAmount: '',
        status: 'received',
        totalAmount: '',
        status: 'received',
    });

    const handleOutsource = (job) => {
        setOutsourcingJob(job);
        setOutsourceData({ name: '', phone: '', cost: '' });
        setShowOutsourceModal(true);
    };

    const submitOutsource = async (e) => {
        e.preventDefault();
        if (!outsourcingJob) return;
        if (!outsourceData.name.trim()) {
            alert('Please select or enter a vendor name');
            return;
        }

        try {
            // Create or update vendor
            await api.post('/vendors', {
                name: outsourceData.name,
                phone: outsourceData.phone
            });

            // Refresh vendors list for next time (optional, but good practice)
            const res = await api.get('/vendors');
            setVendors(res.data);

        } catch (error) {
            console.error('Error saving vendor:', error);
            // Proceed anyway? Or stop? 
            // Better to proceed so job update isn't blocked by minor vendor save error, 
            // but ideally we want to know. For now log and proceed.
        }

        updateJob(outsourcingJob.jobId || outsourcingJob.id, {
            ...outsourcingJob,
            status: 'outsourced',
            outsourced: {
                name: outsourceData.name,
                phone: outsourceData.phone,
                cost: outsourceData.cost,
                date: new Date().toISOString()
            }
        });
        setShowOutsourceModal(false);
        setOutsourcingJob(null);
    };

    const handleReceiveBack = (job) => {
        setReceivingJob(job);
        setReceiveData({
            status: 'ready',
            cost: job.outsourced?.cost || '0'
        });
        setShowReceiveModal(true);
    };

    const submitReceiveBack = (e) => {
        e.preventDefault();
        if (!receivingJob) return;

        updateJob(receivingJob.jobId || receivingJob.id, {
            status: receiveData.status,
            outsourced: {
                ...receivingJob.outsourced,
                cost: receiveData.cost
            }
        });
        setShowReceiveModal(false);
        setReceivingJob(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Construct legacy device string for table display
        const fullDeviceName = `${formData.brand} ${formData.model} (${formData.deviceType})`.trim();
        const submissionData = { ...formData, device: fullDeviceName };

        if (editingJob) {
            const idToUpdate = editingJob.jobId || editingJob.id;
            updateJob(idToUpdate, submissionData);
            setEditingJob(null);
        } else {
            addJob(submissionData);
        }
        resetForm();
        setShowForm(false);
    };

    const handleEdit = (job) => {
        setEditingJob(job);
        setFormData({
            customerName: job.customerName,
            phone: job.phone,
            device: job.device,
            deviceType: job.deviceType || 'Other',
            brand: job.brand || '',
            model: job.model || job.device || '',
            issue: job.issue,
            receivedDate: job.receivedDate ? new Date(job.receivedDate).toISOString().split('T')[0] : '',
            estimatedDelivery: job.estimatedDelivery ? new Date(job.estimatedDelivery).toISOString().split('T')[0] : '',
            technician: job.technician,
            advanceAmount: job.advanceAmount,
            totalAmount: job.totalAmount,
            status: job.status,
        });
        setShowForm(true);
    };

    const handleDelete = (jobId) => {
        if (window.confirm('Are you sure you want to delete this order?')) {
            deleteJob(jobId);
        }
    };

    const resetForm = () => {
        setFormData({
            customerName: '',
            phone: '',
            deviceType: '',
            brand: '',
            model: '',
            device: '',
            issue: '',
            receivedDate: new Date().toISOString().split('T')[0],
            estimatedDelivery: '',
            technician: '',
            advanceAmount: '',
            totalAmount: '',
            status: 'received',
        });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getStatusClass = (status) => {
        const classes = {
            received: 'status-received',
            'in-progress': 'status-in-progress',
            waiting: 'status-waiting',
            ready: 'status-ready',
            waiting: 'status-waiting',
            ready: 'status-ready',
            delivered: 'status-delivered',
            outsourced: 'bg-purple-50 text-purple-600 border-purple-100', // Custom style for outsourced
        };
        return classes[status] || 'status-received';
    };

    const filteredJobs = jobs.filter(job => {
        const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' ||
            (job.jobId || '').toLowerCase().includes(searchLower) ||
            (job.customerName || '').toLowerCase().includes(searchLower) ||
            (job.phone || '').includes(searchTerm) ||
            (job.device || '').toLowerCase().includes(searchLower);

        return matchesStatus && matchesSearch;
    });

    const sortedJobs = [...filteredJobs].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage all service orders</p>
                </div>
                {['admin', 'technician'].includes(user?.role) && (
                    <button
                        onClick={() => {
                            setShowForm(true);
                            setEditingJob(null);
                            resetForm();
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <FiPlus className="w-5 h-5" />
                        New Order
                    </button>
                )}
            </div>

            {/* Filters & Controls */}
            <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                    {['all', 'received', 'in-progress', 'waiting', 'ready', 'delivered', 'outsourced'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize whitespace-nowrap ${filterStatus === status
                                ? 'bg-blue-50 text-[#4361ee] ring-1 ring-[#4361ee]/20'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                        >
                            {status === 'all' ? 'All Orders' : status.replace('-', ' ')}
                        </button>
                    ))}
                </div>

                {/* Search within table (Visual only for now) */}
                <div className="relative w-full sm:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search in orders..."
                        className="input-field !pl-8 py-2 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Jobs Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-800 uppercase tracking-wider">Order ID</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-800 uppercase tracking-wider">Customer</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-800 uppercase tracking-wider">Device</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-800 uppercase tracking-wider">Status</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-800 uppercase tracking-wider">Delivery</th>
                                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-800 uppercase tracking-wider">Balance</th>
                                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-800 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedJobs.map((job) => (
                                <tr key={job._id || job.id || job.jobId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <span className="font-mono text-sm font-medium text-gray-700">#{(job.jobId || job.id || job._id || '').toString().slice(-6)}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div>
                                            <p className="font-medium text-gray-800 capitalize">{job.customerName}</p>
                                            <p className="text-gray-500 text-xs">{job.phone}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-gray-700 text-sm max-w-[150px]" title={job.device}>{job.device}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`status-badge capitalize ${getStatusClass(job.status)}`}>
                                            {job.status.replace('-', ' ')}
                                        </span>
                                        {job.status === "outsourced" && job.outsourced && (
                                            <div className="mt-1.5 text-xs text-purple-600 font-medium">
                                                <div className="flex items-start gap-1">
                                                    <span className="opacity-75">With:</span>

                                                    <div className="flex">
                                                        <span>{job.outsourced.name}</span>

                                                        {job.outsourced.phone && (
                                                            <span className="text-xs opacity-75 ml-1">
                                                                ({job.outsourced.phone})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {["admin"].includes(user?.role) && (
                                                    <div className="flex items-center gap-1 opacity-75">
                                                        <span>Paid:</span> ₹{job.outsourced.cost}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    </td>
                                    <td className="py-4 px-6 text-gray-500 text-sm">
                                        {new Date(job.estimatedDelivery).toLocaleDateString()}
                                    </td>
                                    <td className="py-4 px-6">
                                        {((parseFloat(job.totalAmount) || 0) - (parseFloat(job.advanceAmount) || 0)) <= 0 ? (
                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                                                Paid ₹{job.totalAmount}
                                            </span>
                                        ) : (
                                            <p className="font-semibold text-gray-700 text-sm">
                                                ₹{((parseFloat(job.totalAmount) || 0) - (parseFloat(job.advanceAmount) || 0)).toLocaleString()}
                                            </p>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {['admin', 'technician'].includes(user?.role) && (
                                                <button
                                                    onClick={() => { setViewJob(job); setShowViewModal(true); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                </button>
                                            )}
                                            {['admin', 'technician'].includes(user?.role) && (
                                                <button
                                                    onClick={() => handleEdit(job)}
                                                    className="p-2 text-gray-400 hover:text-[#4361ee] hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit / Update Status"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {['admin', 'technician'].includes(user?.role) && job.status !== 'delivered' && (
                                                job.status === 'outsourced' ? (
                                                    <button
                                                        onClick={() => handleReceiveBack(job)}
                                                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Receive Back from 3rd Party"
                                                    >
                                                        <FiCheckSquare className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOutsource(job)}
                                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="Assign to 3rd Party"
                                                    >
                                                        <FiExternalLink className="w-4 h-4" />
                                                    </button>
                                                )
                                            )}
                                            {/* Get Payment Action */}
                                            {['admin', 'technician'].includes(user?.role) && job.status !== 'delivered' && job.status !== 'outsourced' && (
                                                <button
                                                    onClick={() => handlePayment(job)}
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Get Payment / Deliver"
                                                >
                                                    <BiRupee className="w-4 h-4" />
                                                </button>
                                            )}
                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(job.jobId || job.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Order"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {loading && (
                        <div className="p-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border-b border-gray-50">
                                    <Skeleton className="h-4 w-16" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    )}
                    {sortedJobs.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiFilter className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No orders found</p>
                            <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={editingJob ? 'Edit Order Details' : 'Create New Order'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Form sections similar to previous but with updated classes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Customer Info</h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="input-field" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" required />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Device Details</h4>

                            <div className="grid grid-cols-2 gap-4">
                                <CreatableSelect
                                    label="Device Type"
                                    options={Object.keys(DEVICE_CATEGORIES)}
                                    value={formData.deviceType}
                                    onChange={(val) => setFormData(prev => ({ ...prev, deviceType: val, brand: '' }))}
                                    placeholder="Select Type"
                                />
                                <CreatableSelect
                                    label="Brand"
                                    options={DEVICE_CATEGORIES[formData.deviceType] || []}
                                    value={formData.brand}
                                    onChange={(val) => setFormData(prev => ({ ...prev, brand: val }))}
                                    placeholder="Select Brand"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Name/No.</label>
                                    <input
                                        type="text"
                                        name="model"
                                        value={formData.model}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="e.g. iPhone 13"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Tech</label>
                                    <input
                                        type="text"
                                        name="technician"
                                        value={formData.technician}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                        <textarea name="issue" value={formData.issue} onChange={handleChange} className="input-field min-h-[100px]" required></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
                            <input type="date" name="receivedDate" value={formData.receivedDate} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
                            <input
                                type="date"
                                name="estimatedDelivery"
                                value={formData.estimatedDelivery}
                                onChange={handleChange}
                                className="input-field"
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                        <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Billing Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                    <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} className="input-field !pl-6" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Advance</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                    <input type="number" name="advanceAmount" value={formData.advanceAmount} onChange={handleChange} className="input-field !pl-6" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Balance Pending</label>
                                <div className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 font-bold">
                                    ₹{(parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.advanceAmount) || 0)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                        <Select
                            value={formData.status}
                            onChange={(val) => handleChange({ target: { name: 'status', value: val } })}
                            options={[
                                { value: 'received', label: 'Received' },
                                { value: 'in-progress', label: 'In Progress' },
                                { value: 'waiting', label: 'Waiting for Parts' },
                                { value: 'ready', label: 'Ready for Delivery' },
                                { value: 'delivered', label: 'Delivered' }
                            ]}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary flex items-center gap-2">
                            <FiSave />
                            {editingJob ? 'Save Changes' : 'Create Order'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Outsource Job Modal */}
            <Modal
                isOpen={showOutsourceModal}
                onClose={() => setShowOutsourceModal(false)}
                title="Assign to 3rd Party Technician"
            >
                <form onSubmit={submitOutsource} className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-sm text-yellow-800 mb-4">
                        You are assigning this order to an external technician. The status will be updated to <b>Outsourced</b>.
                    </div>

                    <div>
                        <CreatableSelect
                            label="3rd Party Name / Shop"
                            options={vendors.map(v => v.name)}
                            value={outsourceData.name}
                            onChange={(val) => {
                                const existing = vendors.find(v => v.name === val);
                                setOutsourceData({
                                    ...outsourceData,
                                    name: val,
                                    phone: existing ? existing.phone : (outsourceData.phone || '')
                                });
                            }}
                            placeholder="Select or Create Vendor"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            className="input-field"
                            placeholder="Optional"
                            value={outsourceData.phone}
                            onChange={(e) => setOutsourceData({ ...outsourceData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost / Amount Paid</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                            <input
                                ref={costInputRef}
                                type="number"
                                required
                                className="input-field !pl-8"
                                placeholder="0.00"
                                value={outsourceData.cost}
                                onChange={(e) => setOutsourceData({ ...outsourceData, cost: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">This is the cost paid to the 3rd party, not the customer price.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setShowOutsourceModal(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary bg-purple-600 hover:bg-purple-700 shadow-purple-200">
                            Confirm Assignment
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Receive Back Modal */}
            <Modal
                isOpen={showReceiveModal}
                onClose={() => setShowReceiveModal(false)}
                title="Receive Device from 3rd Party"
            >
                <form onSubmit={submitReceiveBack} className="space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600 mb-4">
                        Confirming return of <b>{receivingJob?.device}</b> from <b>{receivingJob?.outsourced?.name}</b>.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Repair Outcome (New Status)</label>
                        <Select
                            value={receiveData.status}
                            onChange={(val) => setReceiveData({ ...receiveData, status: val })}
                            options={[
                                { value: 'ready', label: 'Repaired (Mark as Ready)' },
                                { value: 'received', label: 'Not Repaired (Back to Received)' },
                                { value: 'in-progress', label: 'Needs More Work (In Progress)' }
                            ]}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Final 3rd Party Cost</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                            <input
                                type="number"
                                required
                                className="input-field !pl-8"
                                value={receiveData.cost}
                                onChange={(e) => setReceiveData({ ...receiveData, cost: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Adjust if the final amount paid differs from the estimate.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setShowReceiveModal(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary flex items-center gap-2">
                            <FiCheckSquare /> Confirm Return
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Get Payment & Deliver Order"
            >
                <form onSubmit={submitPayment} className="space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Total Order Amount:</span>
                            <span className="font-semibold">₹{parseFloat(paymentJob?.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Advance Paid:</span>
                            <span className="font-semibold text-green-600">- ₹{parseFloat(paymentJob?.advanceAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-base border-t border-gray-200 pt-2 mt-2">
                            <span className="font-bold text-gray-800">Pending Balance:</span>
                            <span className="font-bold text-gray-800">₹{((parseFloat(paymentJob?.totalAmount || 0) - parseFloat(paymentJob?.advanceAmount || 0))).toLocaleString()}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentData({ ...paymentData, type: 'full', discountAmount: '' })}
                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${paymentData.type === 'full'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                Paid Full
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentData({ ...paymentData, type: 'discount' })}
                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${paymentData.type === 'discount'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                    }`}
                            >
                                Paid with Discount
                            </button>
                        </div>
                    </div>

                    {paymentData.type === 'discount' && (
                        <div className="animate-fade-in space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                    <input
                                        type="number"
                                        required
                                        className="input-field !pl-8"
                                        placeholder="0.00"
                                        value={paymentData.discountAmount}
                                        onChange={(e) => setPaymentData({ ...paymentData, discountAmount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-blue-600">New Total:</span>
                                    <span className="font-medium">₹{(parseFloat(paymentJob?.totalAmount || 0) - parseFloat(paymentData.discountAmount || 0)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span className="text-blue-800">New Amount to Collect:</span>
                                    <span>₹{((parseFloat(paymentJob?.totalAmount || 0) - parseFloat(paymentJob?.advanceAmount || 0) - parseFloat(paymentData.discountAmount || 0))).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200">
                            <FiCheckSquare />
                            <span>
                                {paymentData.type === 'full'
                                    ? `Confirm & Deliver`
                                    : `Apply Discount & Deliver`}
                            </span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Order Details"
                className="max-w-2xl"
            >
                {viewJob && (
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="flex justify-between items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">Order #{(viewJob.jobId || viewJob.id || viewJob._id || '').toString().slice(-6)}</h3>
                                <p className="text-gray-500 text-sm">Created on {new Date(viewJob.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`status-badge capitalize ${getStatusClass(viewJob.status)}`}>
                                {viewJob.status.replace('-', ' ')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer & Device */}
                            <div className="space-y-4">
                                <div className="card p-4 border border-gray-100 shadow-none">
                                    <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Customer:</span> <span className="font-medium text-gray-800">{viewJob.customerName}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-800">{viewJob.phone}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Device:</span> <span className="font-medium text-gray-800">{viewJob.device}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Technician:</span> <span className="font-medium text-gray-800">{viewJob.technician || 'Unassigned'}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Financials */}
                            <div className="space-y-4">
                                <div className="card p-4 border border-gray-100 shadow-none">
                                    <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Financials</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Total Amount:</span> <span className="font-medium text-gray-800">₹{parseFloat(viewJob.totalAmount || 0).toLocaleString()}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Advance Paid:</span> <span className="font-medium text-emerald-600">-₹{parseFloat(viewJob.advanceAmount || 0).toLocaleString()}</span></div>
                                        <div className="pt-2 border-t border-gray-100 flex justify-between font-bold">
                                            <span className="text-gray-700">Balance:</span>
                                            <span>₹{((parseFloat(viewJob.totalAmount || 0) - parseFloat(viewJob.advanceAmount || 0))).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Outsource Info (if exists) */}
                        {viewJob.outsourced && viewJob.outsourced.name && (
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <h4 className="font-semibold text-purple-800 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                                    <FiExternalLink /> Outsourced Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm text-purple-900">
                                    <div><span className="opacity-70">Vendor:</span> <span className="font-medium">{viewJob.outsourced.name}</span></div>
                                    <div><span className="opacity-70">Contact:</span> <span className="font-medium">{viewJob.outsourced.phone || 'N/A'}</span></div>
                                    <div><span className="opacity-70">Vendor Cost:</span> <span className="font-medium">₹{parseFloat(viewJob.outsourced.cost || 0).toLocaleString()}</span></div>
                                    <div><span className="opacity-70">Date:</span> <span className="font-medium">{viewJob.outsourced.date ? new Date(viewJob.outsourced.date).toLocaleDateString() : 'N/A'}</span></div>
                                </div>
                            </div>
                        )}

                        {/* Status Timeline */}
                        <div className="border-t border-gray-100 pt-6">
                            <h4 className="font-semibold text-gray-800 mb-4">Status History</h4>
                            <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:h-full before:w-[2px] before:bg-gray-100">
                                {viewJob.statusHistory && viewJob.statusHistory.length > 0 ? (
                                    [...viewJob.statusHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((history, idx) => (
                                        <div key={idx} className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-blue-500 z-10"></div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800 capitalize text-sm">{history.status.replace('-', ' ')}</span>
                                                <span className="text-xs text-gray-400">{new Date(history.timestamp).toLocaleString()}</span>
                                                {history.note && <p className="text-xs text-gray-500 mt-0.5">{history.note}</p>}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-gray-300 z-10"></div>
                                        <p className="text-sm text-gray-500">Current Status: <span className="font-medium capitalize">{viewJob.status.replace('-', ' ')}</span></p>
                                        <p className="text-xs text-gray-400">History tracking started recently.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={() => setShowViewModal(false)} className="btn-secondary">Close</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
};

export default Jobs;
