import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useJobs } from '../context/JobContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import OTPVerification from '../components/OTPVerification';
import CameraCapture from '../components/CameraCapture';
import CreatableSelect from '../components/ui/CreatableSelect';
import Select from '../components/ui/Select';
import { FiHome, FiUpload, FiCamera, FiX, FiCalendar, FiSave, FiArrowLeft } from 'react-icons/fi';
import { BiBadgeCheck } from 'react-icons/bi';

const DEVICE_CATEGORIES = {
    Mobile: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Motorola'],
    Laptop: ['HP', 'Dell', 'Lenovo', 'Acer', 'Asus', 'Apple', 'MSI', 'Microsoft'],
    CCTV: ['Hikvision', 'CP Plus', 'Dahua', 'Honeywell'],
    Printer: ['HP', 'Canon', 'Epson', 'Brother'],
    Other: []
};

const JobForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addJob, updateJob } = useJobs();
    const { user } = useAuth(); // If needed for role checks

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!id);

    // OTP & Settings State
    const [whatsappSettings, setWhatsappSettings] = useState(null);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [verifyingPhone, setVerifyingPhone] = useState('');

    // Files
    const [beforeFiles, setBeforeFiles] = useState([]);
    const [existingBeforeImages, setExistingBeforeImages] = useState([]);
    const beforeFileRef = useRef(null);

    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const [cameraTarget, setCameraTarget] = useState(null); // 'before'

    const [formData, setFormData] = useState({
        customerName: '',
        phone: '',
        deviceType: '',
        brand: '',
        model: '',
        issue: '',
        totalAmount: '',
        advanceAmount: '',
        estimatedDelivery: '',
        status: 'received',
        technician: '',
        note: '',
        warranty: '',
        isWarranty: false,
        type: 'walk-in',
        address: '',
        visitDate: '',
        receivedDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                if (user) {
                    const { data } = await api.get('/settings');
                    setWhatsappSettings(data.whatsapp);
                }
            } catch (error) {
                console.error('Failed to fetch settings', error);
            }
        };
        fetchSettings();
    }, [user]);

    useEffect(() => {
        if (id) {
            const fetchJob = async () => {
                try {
                    const { data } = await api.get(`/jobs/${id}`);
                    const job = data;
                    setFormData({
                        customerName: job.customerName || '',
                        phone: job.phone || '',
                        deviceType: job.deviceType || '',
                        brand: job.brand || '',
                        model: job.model || '',
                        issue: job.issue || '',
                        totalAmount: job.totalAmount || '',
                        advanceAmount: job.advanceAmount || '',
                        estimatedDelivery: job.estimatedDelivery ? new Date(job.estimatedDelivery).toISOString().split('T')[0] : '',
                        status: job.status || 'received',
                        technician: job.technician || '',
                        note: job.note || '',
                        warranty: job.warranty || '',
                        isWarranty: job.isWarranty || false,
                        type: job.type || 'walk-in',
                        address: job.address || '',
                        visitDate: job.visitDate ? new Date(job.visitDate).toISOString().slice(0, 16) : '',
                        receivedDate: job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                    });

                    if (job.images && job.images.before) {
                        setExistingBeforeImages(job.images.before);
                    }
                } catch (error) {
                    toast.error("Failed to load order details");
                    navigate('/jobs');
                } finally {
                    setFetching(false);
                }
            };
            fetchJob();
        }
    }, [id, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e, setFiles) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
        e.target.value = null;
    };

    const openCamera = (target) => {
        setCameraTarget(target);
        setShowCamera(true);
    };

    const handleCameraCapture = (file) => {
        if (!file) return;
        if (cameraTarget === 'before') {
            setBeforeFiles(prev => [...prev, file]);
        }
        setShowCamera(false);
        setCameraTarget(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // OTP Verification Check (Only for New Orders)
        if (!id && whatsappSettings?.enabled && whatsappSettings?.otpVerification && !otpVerified) {
            setVerifyingPhone(formData.phone);
            setShowOtpModal(true);
            return;
        }

        setLoading(true);
        const fullDeviceName = `${formData.brand} ${formData.model}`.trim();
        const submissionData = { ...formData, device: fullDeviceName };

        if (submissionData.isWarranty) {
            submissionData.totalAmount = 0;
            submissionData.advanceAmount = 0;
            delete submissionData.paymentBreakdown;
        }

        // Logic to construct payment breakdown if totals changed? 
        // For simplicity, we assume Edit on Amount fields just updates total/advance.

        const data = new FormData();
        Object.keys(submissionData).forEach(key => {
            // Handle date parsing or keep as string? Backend usually handles it.
            // But visitDate needs to be correct format.
            data.append(key, submissionData[key]);
        });

        beforeFiles.forEach(file => {
            data.append('beforeImages', file);
        });

        try {
            if (id) {
                const res = await api.put(`/jobs/${id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (res.data) {
                    // Update context
                    updateJob(res.data);
                    toast.success('Order updated successfully');
                    navigate('/jobs');
                }
            } else {
                const res = await addJob(data); // addJob handles FormData usually? 
                // Wait, useJobs.addJob calls api.post.
                // If context addJob doesn't support FormData, we might need to check.
                // context/JobContext.jsx usually wraps api calls.
                // Assuming it works or I'll use api directly.
                // Re-checking Jobs.jsx: removeJob, addJob usage.
                // Jobs.jsx used `addJob(data)`.
                toast.success('Order created successfully');
                navigate('/jobs');
            }
        } catch (error) {
            console.error("Submission error", error);
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/jobs')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <FiArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{id ? 'Edit Order' : 'New Order'}</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

                {/* Service Type Toggle */}
                <div className="flex gap-4 mb-8 p-1 bg-gray-100 rounded-lg w-fit">
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
                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Customer Info</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                                    <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <div className="relative">
                                        {otpVerified && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in duration-200">
                                                <BiBadgeCheck className="w-5 h-5" />
                                            </div>
                                        )}
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className={`input-field transition-all ${otpVerified ? '!pr-10 bg-green-50 text-green-900 border-green-200 cursor-not-allowed font-medium' : ''}`}
                                            required
                                            disabled={otpVerified}
                                        />
                                    </div>
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

                        {/* Device Details */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Device Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* Images */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Before Condition Images</label>
                            <div className="flex gap-2 mb-2">
                                <button type="button" onClick={() => beforeFileRef.current.click()} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-sm transition-all">
                                    <FiUpload /> Gallery
                                </button>
                                <button type="button" onClick={() => openCamera('before')} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-blue-200 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm transition-all">
                                    <FiCamera /> Camera
                                </button>
                            </div>
                            <input type="file" ref={beforeFileRef} multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setBeforeFiles)} />
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

                            {existingBeforeImages.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 mb-2">Existing Images</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {existingBeforeImages.map((img, index) => {
                                            const baseUrl = import.meta.env.VITE_API_URL
                                                ? import.meta.env.VITE_API_URL.replace('/api', '')
                                                : 'http://localhost:5000';
                                            const imgUrl = img.startsWith('http') ? img : `${baseUrl}${img}`;
                                            return (
                                                <div key={`existing-${index}`} className="relative aspect-square">
                                                    <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={imgUrl}
                                                            alt={`existing ${index}`}
                                                            className="w-full h-full object-cover rounded-lg border border-gray-200"
                                                        />
                                                    </a>
                                                    {/* Optional: Add delete button here if backend supports deleting individual images */}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
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

                    {/* Warranty */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isWarranty"
                                checked={formData.isWarranty}
                                onChange={(e) => setFormData({ ...formData, isWarranty: e.target.checked })}
                                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="isWarranty" className="text-sm font-semibold text-gray-800 select-none cursor-pointer flex items-center gap-2">
                                Cover under Warranty (No Billing Required)
                            </label>
                        </div>

                        {formData.isWarranty && (
                            <div className="animate-in fade-in slide-in-from-top-1 pl-8">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Details / Policy</label>
                                <input
                                    type="text"
                                    name="warranty"
                                    value={formData.warranty}
                                    onChange={handleChange}
                                    className="input-field bg-white"
                                    placeholder="e.g. Warranty ID, Provider, Terms"
                                />
                            </div>
                        )}
                    </div>

                    {/* Billing */}
                    {!formData.isWarranty && (
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100 animate-in fade-in slide-in-from-top-2">
                            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Billing Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimation Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                        <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} className="input-field !pl-6" required={!formData.isWarranty} />
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
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                        <Select
                            value={formData.status}
                            onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
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

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button type="button" onClick={() => navigate('/jobs')} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                            <FiSave /> {loading ? 'Saving...' : 'Save Order'}
                        </button>
                    </div>

                </form>
            </div >

            {/* OTP Modal */}
            {
                showOtpModal && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <OTPVerification
                            phone={verifyingPhone}
                            onVerified={() => {
                                setOtpVerified(true);
                                setShowOtpModal(false);
                                toast.success('Verified! Click Save Order to finish.', { icon: '✅' });
                            }}
                            onCancel={() => {
                                setShowOtpModal(false);
                                setVerifyingPhone('');
                            }}
                        />
                    </div>
                )
            }

            {/* Camera Modal */}
            {
                showCamera && (
                    <CameraCapture
                        onCapture={handleCameraCapture}
                        onClose={() => setShowCamera(false)}
                    />
                )
            }
        </div >
    );
};

export default JobForm;
