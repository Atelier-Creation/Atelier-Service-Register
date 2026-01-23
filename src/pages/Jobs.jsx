import { useEffect, useState, useRef } from 'react';
import { useJobs } from '../context/JobContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import CreatableSelect from '../components/ui/CreatableSelect';
import Select from '../components/ui/Select';
import api from '../api/client';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiFilter, FiSearch, FiExternalLink, FiCheckSquare, FiEye, FiRotateCcw, FiHome, FiMapPin, FiCalendar } from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';

const DEVICE_CATEGORIES = {
    Mobile: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Motorola'],
    Laptop: ['HP', 'Dell', 'Lenovo', 'Acer', 'Asus', 'Apple', 'MSI', 'Microsoft'],
    CCTV: ['Hikvision', 'CP Plus', 'Dahua', 'Honeywell'],
    Printer: ['HP', 'Canon', 'Epson', 'Brother'],
    Other: []
};

const Jobs = () => {
    const { addJob, updateJob, deleteJob } = useJobs();
    const [jobs, setJobs] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Search & Filter State
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        // Reset list when filter or search changes
        setPage(1);
        setJobs([]);
        setHasMore(true);
        // We will trigger fetch in the next effect due to dependency on page/filter/search
    }, [filterStatus, debouncedSearch]);

    const fetchJobs = async () => {
        if (!hasMore && page > 1) return;

        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                search: debouncedSearch,
                filter: filterStatus
            };
            const { data } = await api.get('/jobs', { params });

            if (data.jobs.length === 0) {
                if (page === 1) setJobs([]);
                setHasMore(false);
            } else {
                setJobs(prev => page === 1 ? data.jobs : [...prev, ...data.jobs]);
                if (data.jobs.length < 20) setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filterStatus, debouncedSearch]);

    // Infinite Scroll
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && hasMore && !loading) {
                setPage(prev => prev + 1);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [hasMore, loading]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);

        // Handle 'New Order' action
        if (searchParams.get('action') === 'new') {
            setEditingJob(null);
            setShowForm(true);
            navigate('/jobs', { replace: true });
        }

        // Handle search query
        const searchParam = searchParams.get('search');
        if (searchParam) {
            setSearchTerm(searchParam);
        }

        // Handle filter param
        const filterParam = searchParams.get('filter');
        if (filterParam) {
            setFilterStatus(filterParam);
        }

        // Handle 'View Job' action
        const viewJobId = searchParams.get('view');
        if (viewJobId) {
            // We might not have the job loaded if it's old. Fetch it individually if not found.
            const jobToView = jobs.find(j => (j.jobId || j.id || j._id) === viewJobId);
            if (jobToView) {
                setViewJob(jobToView);
                setShowViewModal(true);
            } else {
                // Fetch specifically? Maybe later.
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
        finalAmount: '',
        warranty: '',
        breakdown: ''
    });
    const [paymentFiles, setPaymentFiles] = useState([]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingJobId, setDeletingJobId] = useState(null);

    const handlePayment = (job) => {
        const balance = (parseFloat(job.totalAmount) || 0) - (parseFloat(job.advanceAmount) || 0);
        setPaymentJob(job);
        setPaymentData({
            type: 'full',
            discountAmount: '',
            finalAmount: balance,
            finalAmount: balance,
            mode: 'Cash',
            warranty: job.warranty || '',
            breakdownItems: [{ description: '', amount: '' }]
        });
        setPaymentFiles([]); // Reset files
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

        let breakdownNote = '';
        if (paymentData.breakdownItems && paymentData.breakdownItems.length > 0) {
            const validItems = paymentData.breakdownItems?.filter(i => i.description.trim() || i.amount);
            if (validItems.length > 0) {
                const itemsStr = validItems.map(i => `${i.description || 'Item'}: ₹${i.amount || 0}`).join(', ');
                const total = validItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
                breakdownNote = `. Breakdown: ${itemsStr} (Total: ₹${total})`;
            }
        }

        const updateData = {
            ...paymentJob,
            status: 'delivered',
            totalAmount: newTotal,
            advanceAmount: newAdvance,
            warranty: paymentData.warranty,
            warranty: paymentData.warranty,
            warranty: paymentData.warranty,
            note: `Payment collected via ${paymentData.mode || 'Cash'}${breakdownNote}`
        };

        if (paymentFiles.length > 0) {
            const fd = new FormData();
            Object.keys(updateData).forEach(key => {
                if (key !== 'images' && key !== 'statusHistory' && key !== 'createdAt' && key !== 'updatedAt') {
                    fd.append(key, updateData[key]);
                }
            });
            fd.append('status', 'delivered');
            fd.append('totalAmount', newTotal);
            fd.append('advanceAmount', newAdvance);
            fd.append('note', updateData.note);
            fd.append('warranty', paymentData.warranty);

            paymentFiles.forEach(file => fd.append('afterImages', file));

            updateJob(paymentJob.jobId || paymentJob.id, fd).then(res => {
                // Update local list
                setJobs(prev => prev.map(j => (j.jobId || j.id) === (res.jobId || res.id) ? res : j));
            });
        } else {
            updateJob(paymentJob.jobId || paymentJob.id, updateData).then(res => {
                setJobs(prev => prev.map(j => (j.jobId || j.id) === (res.jobId || res.id) ? res : j));
            });
        }

        setShowPaymentModal(false);
        setPaymentJob(null);
        setPaymentFiles([]);
    };

    // Return / Reject State
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnJob, setReturnJob] = useState(null);
    const [returnData, setReturnData] = useState({
        type: 'without-repair', // 'without-repair' or 'service-charge'
        serviceCharge: '',
        note: ''
    });

    const handleReturn = (job) => {
        setReturnJob(job);
        setReturnData({
            type: 'without-repair',
            serviceCharge: '',
            note: ''
        });
        setPaymentFiles([]); // Reset files, recycle this state for images
        setShowReturnModal(true);
    };

    const submitReturn = (e) => {
        e.preventDefault();
        if (!returnJob) return;

        let newTotal = 0;
        let newAdvance = parseFloat(returnJob.advanceAmount) || 0;
        let note = returnData.note || 'Returned without repair';

        if (returnData.type === 'service-charge') {
            const charge = parseFloat(returnData.serviceCharge) || 0;
            newTotal = charge;
            // Balance logic: if advance > charge, maybe refund? Assuming simple model where total becomes the charge.
            // If advance exists, it covers the charge. If not, they pay.
            // Balance = Total - Advance.
            note = `Returned with service charge: ₹${charge}. ${returnData.note}`;
        } else {
            // Return without repair. Total should effectively be 0 or equal to advance if we keep it?
            // Usually implies cancelling the remaining amount.
            // Let's set Total to Advance so Balance is 0.
            newTotal = newAdvance;
            note = `Returned without repair. ${returnData.note}`;
        }

        const updateData = {
            ...returnJob,
            status: 'returned', // Item is leaving shop
            totalAmount: newTotal,
            // advanceAmount stays same
            note: note
        };

        if (paymentFiles.length > 0) {
            const fd = new FormData();
            Object.keys(updateData).forEach(key => {
                if (key !== 'images' && key !== 'statusHistory' && key !== 'createdAt' && key !== 'updatedAt') {
                    fd.append(key, updateData[key]);
                }
            });
            fd.append('status', 'returned');
            fd.append('totalAmount', newTotal);
            fd.append('note', note);

            paymentFiles.forEach(file => fd.append('afterImages', file));

            updateJob(returnJob.jobId || returnJob.id, fd).then(res => {
                setJobs(prev => prev.map(j => (j.jobId || j.id) === (res.jobId || res.id) ? res : j));
            });
        } else {
            updateJob(returnJob.jobId || returnJob.id, updateData).then(res => {
                setJobs(prev => prev.map(j => (j.jobId || j.id) === (res.jobId || res.id) ? res : j));
            });
        }

        setShowReturnModal(false);
        setReturnJob(null);
        setPaymentFiles([]);
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
        totalAmount: '',
        status: 'received',
        warranty: '',
        type: 'walk-in',
        address: '',
        visitDate: ''
    });
    const [beforeFiles, setBeforeFiles] = useState([]);
    const [afterFiles, setAfterFiles] = useState([]);

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
        }).then(res => {
            setJobs(prev => prev.map(j => (j.jobId || j.id) === (res.jobId || res.id) ? res : j));
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
        }).then(res => {
            setJobs(prev => prev.map(j => (j.jobId || j.id) === (res.jobId || res.id) ? res : j));
        });
        setShowReceiveModal(false);
        setReceivingJob(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Construct legacy device string for table display
        const fullDeviceName = `${formData.brand} ${formData.model} (${formData.deviceType})`.trim();
        const submissionData = { ...formData, device: fullDeviceName };

        let dataToSend = submissionData;
        const hasFiles = beforeFiles.length > 0 || afterFiles.length > 0;

        if (hasFiles) {
            const fd = new FormData();
            Object.keys(submissionData).forEach(key => {
                fd.append(key, submissionData[key]);
            });
            beforeFiles.forEach(file => fd.append('beforeImages', file));
            afterFiles.forEach(file => fd.append('afterImages', file));
            dataToSend = fd;
        }

        if (editingJob) {
            const idToUpdate = editingJob.jobId || editingJob.id;
            updateJob(idToUpdate, dataToSend).then(res => {
                setJobs(prev => prev.map(j => (j.jobId || j.id) === (res.jobId || res.id) ? res : j));
            });
            setEditingJob(null);
        } else {
            addJob(dataToSend).then(res => {
                setJobs(prev => [res, ...prev]);
            });
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
            warranty: job.warranty || '',
            type: job.type || 'walk-in',
            address: job.address || '',
            visitDate: job.visitDate ? new Date(job.visitDate).toISOString().slice(0, 16) : ''
        });
        setShowForm(true);
    };

    const handleDelete = (id) => {
        setDeletingJobId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (deletingJobId) {
            await deleteJob(deletingJobId);
            setJobs(prev => prev?.filter(j => (j.jobId || j.id) !== deletingJobId));
            setShowDeleteModal(false);
            setDeletingJobId(null);
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
        setBeforeFiles([]);
        setAfterFiles([]);
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
            delivered: 'status-delivered',
            outsourced: 'bg-purple-50 text-purple-600 border-purple-100', // Custom style for outsourced
            returned: 'bg-orange-50 text-orange-600 border-orange-100',
        };
        return classes[status] || 'status-received';
    };

    const isHomeService = (job) => job.type === 'home-service'; // Helper

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
                    {['all', 'received', 'in-progress', 'waiting', 'ready', 'delivered', 'returned', 'outsourced'].map((status) => (
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
                            {jobs.map((job) => (
                                <tr key={job._id || job.id || job.jobId} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <span className="font-mono text-sm font-medium text-gray-700">#{(job.jobId || job.id || job._id || '').toString().slice(-6)}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div>
                                            <p className="font-medium text-gray-800 capitalize flex items-center gap-1">
                                                {job.customerName}
                                                {isHomeService(job) && <FiHome className="text-blue-500 w-3 h-3" title="Home Service" />}
                                            </p>
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
                                        {isHomeService(job) ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium text-blue-600">Visit:</span>
                                                <span className="text-xs">{job.visitDate ? new Date(job.visitDate).toLocaleString() : 'Not scheduled'}</span>
                                            </div>
                                        ) : (
                                            new Date(job.estimatedDelivery).toLocaleDateString()
                                        )}
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
                                                    className="p-2 bg-white text-gray-400 hover:text-[#4361ee] hover:shadow-md rounded-lg shadow-sm border border-gray-100 transition-all"
                                                    title="View Details"
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                </button>
                                            )}
                                            {['admin', 'technician'].includes(user?.role) && job.status !== 'delivered' && job.status !== 'returned' && (
                                                <button
                                                    onClick={() => handleEdit(job)}
                                                    className="p-2 bg-white text-gray-400 hover:text-[#4361ee] hover:shadow-md rounded-lg shadow-sm border border-gray-100 transition-all"
                                                    title="Edit / Update Status"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            {['admin', 'technician'].includes(user?.role) && job.status !== 'delivered' && job.status !== 'returned' && (
                                                job.status === 'outsourced' ? (
                                                    <button
                                                        onClick={() => handleReceiveBack(job)}
                                                        className="p-2 bg-white text-gray-400 hover:text-emerald-600 hover:shadow-md rounded-lg shadow-sm border border-gray-100 transition-all"
                                                        title="Receive Back from 3rd Party"
                                                    >
                                                        <FiCheckSquare className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOutsource(job)}
                                                        className="p-2 bg-white text-gray-400 hover:text-purple-600 hover:shadow-md rounded-lg shadow-sm border border-gray-100 transition-all"
                                                        title="Assign to 3rd Party"
                                                    >
                                                        <FiExternalLink className="w-4 h-4" />
                                                    </button>
                                                )
                                            )}
                                            {/* Get Payment Action */}
                                            {['admin', 'technician'].includes(user?.role) && job.status !== 'delivered' && job.status !== 'returned' && job.status !== 'outsourced' && (
                                                <>
                                                    <button
                                                        onClick={() => handleReturn(job)}
                                                        className="p-2 bg-white text-gray-400 hover:text-orange-500 hover:shadow-md rounded-lg shadow-sm border border-gray-100 transition-all"
                                                        title="Return / Reject Order"
                                                    >
                                                        <FiRotateCcw className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePayment(job)}
                                                        className="p-2 bg-white text-gray-400 hover:text-emerald-600 hover:shadow-md rounded-lg shadow-sm border border-gray-100 transition-all"
                                                        title="Get Payment / Deliver"
                                                    >
                                                        <BiRupee className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(job.jobId || job.id)}
                                                    className="p-2 bg-white text-gray-400 hover:text-red-500 hover:shadow-md rounded-lg shadow-sm border border-gray-100 transition-all"
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
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    )}
                    {!loading && jobs.length === 0 && (
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
                title={editingJob ? 'Edit Order' : 'New Order'}
            >
                {/* <h3 className="text-xl font-bold text-gray-800 mb-6"></h3> */}

                {/* Service Type Toggle */}
                <div className="flex gap-4 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'walk-in' })}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${formData.type === 'walk-in' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Walk-in
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'home-service' })}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${formData.type === 'home-service' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FiHome className="w-4 h-4" /> Home Service
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Form sections similar to previous but with updated classes */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Customer Info</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                    <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" required />
                                </div>
                            </div>

                            {formData.type === 'home-service' && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Address <span className="text-red-500">*</span></label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="input-field min-h-[80px]"
                                        placeholder="Full address for technician visit..."
                                        required
                                    ></textarea>
                                </div>
                            )}
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (Optional)</label>
                                <input
                                    type="text"
                                    name="warranty"
                                    value={formData.warranty}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="e.g. 3 Months, No Warranty"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Issue Description</label>
                        <textarea name="issue" value={formData.issue} onChange={handleChange} className="input-field min-h-[100px]" required></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Before Condition Images</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => setBeforeFiles(Array.from(e.target.files))}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">{beforeFiles.length} files selected</p>
                            {beforeFiles.length > 0 && (
                                <div className="mt-2 grid grid-cols-4 gap-2">
                                    {beforeFiles.map((file, index) => (
                                        <div key={index} className="relative aspect-square group">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`preview ${index}`}
                                                className="w-full h-full object-cover rounded-lg border border-gray-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setBeforeFiles(prev => prev?.filter((_, i) => i !== index))}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <FiX className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Received / Booking Date</label>
                            <input type="date" name="receivedDate" value={formData.receivedDate} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            {formData.type === 'home-service' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><FiCalendar /> Scheduled Visit Date/Time <span className="text-red-500">*</span></label>
                                    <input
                                        type="datetime-local"
                                        name="visitDate"
                                        value={formData.visitDate}
                                        onChange={handleChange}
                                        className="input-field bg-blue-50 border-blue-200 focus:border-blue-500"
                                        required
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
                                    <input type="date" name="estimatedDelivery" value={formData.estimatedDelivery} onChange={handleChange} className="input-field" />
                                </div>
                            )}
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
                                { value: 'delivered', label: 'Delivered' },
                                { value: 'returned', label: 'Returned' }
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

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                            <div className="flex flex-wrap gap-2">
                                {['Cash', 'UPI', 'Card', 'Other'].map((mode) => (
                                    <label key={mode} className={`cursor-pointer border rounded-lg px-4 py-3 text-sm flex items-center gap-3 transition-all ${(paymentData.mode || 'Cash') === mode
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                                        }`}>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${(paymentData.mode || 'Cash') === mode
                                            ? 'border-blue-500 bg-blue-500'
                                            : 'border-gray-300 bg-white'
                                            }`}>
                                            {(paymentData.mode || 'Cash') === mode && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <input
                                            type="radio"
                                            name="paymentMode"
                                            value={mode}
                                            checked={(paymentData.mode || 'Cash') === mode}
                                            onChange={(e) => setPaymentData({ ...paymentData, mode: e.target.value })}
                                            className="hidden"
                                        />
                                        <span className="font-medium select-none">{mode}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="animate-fade-in bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Payment Breakdown</label>
                            <button
                                type="button"
                                onClick={() => setPaymentData({
                                    ...paymentData,
                                    breakdownItems: [...(paymentData.breakdownItems || []), { description: '', amount: '' }]
                                })}
                                className="text-xs flex items-center gap-1 text-blue-600 font-medium hover:text-blue-700"
                            >
                                <FiPlus className="w-3 h-3" /> Add Item
                            </button>
                        </div>

                        <div className="space-y-2">
                            {(paymentData.breakdownItems || []).map((item, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        className="input-field !bg-white flex-grow text-sm py-2"
                                        value={item.description}
                                        onChange={(e) => {
                                            const newItems = [...paymentData.breakdownItems];
                                            newItems[index].description = e.target.value;
                                            setPaymentData({ ...paymentData, breakdownItems: newItems });
                                        }}
                                    />
                                    <div className="relative w-24 shrink-0">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                                        <input
                                            type="number"
                                            placeholder="Amt"
                                            className="input-field !bg-white !pl-5 text-sm py-2"
                                            value={item.amount}
                                            onChange={(e) => {
                                                const newItems = [...paymentData.breakdownItems];
                                                newItems[index].amount = e.target.value;
                                                setPaymentData({ ...paymentData, breakdownItems: newItems });
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newItems = paymentData.breakdownItems?.filter((_, i) => i !== index);
                                            setPaymentData({ ...paymentData, breakdownItems: newItems });
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {(paymentData.breakdownItems || []).some(i => i.amount) && (
                            <div className="flex justify-end mt-2 text-sm">
                                <span className="text-gray-500 mr-2">Total Breakdown:</span>
                                <span className="font-semibold text-gray-800">
                                    ₹{(paymentData.breakdownItems || []).reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0).toLocaleString()}
                                </span>
                            </div>
                        )}
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
                                        min={0}
                                        max={(parseFloat(paymentJob?.totalAmount || 0) - parseFloat(paymentJob?.advanceAmount || 0)) * 0.5}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const pendingAmount = (parseFloat(paymentJob?.totalAmount || 0) - parseFloat(paymentJob?.advanceAmount || 0));
                                            const maxDiscount = pendingAmount * 0.5;

                                            if (parseFloat(val) > maxDiscount) {
                                                setPaymentData({ ...paymentData, discountAmount: maxDiscount });
                                            } else {
                                                setPaymentData({ ...paymentData, discountAmount: val });
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Max discount allowed: ₹{((parseFloat(paymentJob?.totalAmount || 0) - parseFloat(paymentJob?.advanceAmount || 0)) * 0.5).toLocaleString()} (50% of Balance)
                                </p>
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Details</label>
                        <input
                            type="text"
                            value={paymentData.warranty}
                            onChange={(e) => setPaymentData({ ...paymentData, warranty: e.target.value })}
                            className="input-field"
                            placeholder="e.g. 1 Month Testing Warranty"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">After Repair Images (Proof of Delivery condition)</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setPaymentFiles(Array.from(e.target.files))}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">{paymentFiles.length} files selected</p>
                        {paymentFiles.length > 0 && (
                            <div className="mt-2 grid grid-cols-4 gap-2">
                                {paymentFiles.map((file, index) => (
                                    <div key={index} className="relative aspect-square group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`preview ${index}`}
                                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setPaymentFiles(prev => prev?.filter((_, i) => i !== index))}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <FiX className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

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

            {/* Return / Reject Modal */}
            <Modal
                isOpen={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                title="Return / Reject Order"
            >
                <form onSubmit={submitReturn} className="space-y-6">
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-sm text-orange-800 mb-4">
                        You are marking this order as <b>Returned</b>. The status will be updated to <b>Returned</b> (Closed).
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Return Type</label>
                        <div className="flex flex-col gap-3">
                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${returnData.type === 'without-repair' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="returnType"
                                    value="without-repair"
                                    checked={returnData.type === 'without-repair'}
                                    onChange={() => setReturnData({ ...returnData, type: 'without-repair' })}
                                    className="mr-3 text-orange-600 focus:ring-orange-500"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">Return Without Repair</span>
                                    <span className="block text-xs text-gray-500">No charges applied. Balance will be cleared.</span>
                                </div>
                            </label>

                            <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${returnData.type === 'service-charge' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    name="returnType"
                                    value="service-charge"
                                    checked={returnData.type === 'service-charge'}
                                    onChange={() => setReturnData({ ...returnData, type: 'service-charge' })}
                                    className="mr-3 text-orange-600 focus:ring-orange-500"
                                />
                                <div>
                                    <span className="block text-sm font-medium text-gray-900">Return with Service Charge</span>
                                    <span className="block text-xs text-gray-500">Apply a small inspection or service fee.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {returnData.type === 'service-charge' && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                <input
                                    type="number"
                                    required
                                    className="input-field !pl-8"
                                    placeholder="0.00"
                                    value={returnData.serviceCharge}
                                    onChange={(e) => setReturnData({ ...returnData, serviceCharge: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note / Reason</label>
                        <textarea
                            className="input-field"
                            placeholder="e.g. Parts not available, Customer refused estimate..."
                            value={returnData.note}
                            onChange={(e) => setReturnData({ ...returnData, note: e.target.value })}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Device Images (Optional)</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setPaymentFiles(Array.from(e.target.files))}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">{paymentFiles.length} files selected</p>
                        {paymentFiles.length > 0 && (
                            <div className="mt-2 grid grid-cols-4 gap-2">
                                {paymentFiles.map((file, index) => (
                                    <div key={index} className="relative aspect-square group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`preview ${index}`}
                                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setPaymentFiles(prev => prev?.filter((_, i) => i !== index))}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <FiX className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setShowReturnModal(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary bg-orange-600 hover:bg-orange-700 shadow-orange-200">
                            Confirm Return
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

                        {isHomeService(viewJob) && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3 text-sm text-blue-800">
                                <FiHome className="mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-bold">Home Service Order</p>
                                    <p><span className="opacity-70">Address:</span> {viewJob.address}</p>
                                    <p><span className="opacity-70">Scheduled Visit:</span> {viewJob.visitDate ? new Date(viewJob.visitDate).toLocaleString() : 'Not Scheduled'}</p>
                                </div>
                            </div>
                        )}

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
                                        <div className="flex justify-between"><span className="text-gray-500">Warranty:</span> <span className="font-medium text-gray-800">{viewJob.warranty || 'No Warranty'}</span></div>
                                        <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                                            <span className="text-gray-500">Issue:</span>
                                            <span className="font-medium text-gray-800 text-right max-w-[60%] break-words">{viewJob.issue}</span>
                                        </div>
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

                        {/* Images Section */}
                        {viewJob.images && (
                            <div className="space-y-4">
                                {(viewJob.images.before?.length > 0 || viewJob.images.after?.length > 0) && (
                                    <h4 className="font-semibold text-gray-800 mb-2">Device Images</h4>
                                )}
                                {viewJob.images.before?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-2">Before Repair</p>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {viewJob.images.before.map((img, i) => {
                                                const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
                                                const imgUrl = `${baseUrl}${img}`;
                                                return (
                                                    <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer">
                                                        <img src={imgUrl} alt="Before" className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {viewJob.images.after?.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-gray-500 mb-2">After Repair</p>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {viewJob.images.after.map((img, i) => {
                                                const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
                                                const imgUrl = `${baseUrl}${img}`;
                                                return (
                                                    <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer">
                                                        <img src={imgUrl} alt="After" className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirm Deletion"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete this order? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-2"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            Delete Permanently
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
};

export default Jobs;
