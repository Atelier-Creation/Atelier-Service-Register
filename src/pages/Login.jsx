import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Mock UI Components for Background
const BackgroundCard = ({ className, index = 1 }) => {
    // Deterministic content based on index for seamless looping
    const isEven = index % 2 === 0;
    const price = 1000 + (index * 153) % 4000;
    const orderId = 1000 + (index * 79) % 9000;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={{ delay: (index % 5) * 0.1, duration: 0.8 }}
            className={`bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 ${className} flex flex-col justify-between`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isEven ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                        <div className="w-5 h-5 rounded-md bg-current opacity-20" />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-700 text-sm">Order #{orderId}</div>
                        <div className="text-xs text-gray-400">Fixed Display</div>
                    </div>
                </div>
                <span className="text-xs font-bold text-gray-700">₹{price}</span>
            </div>

            <div className="flex gap-2 mt-2">
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${isEven ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {isEven ? 'Delivered' : 'In Progress'}
                </span>
            </div>
        </motion.div>
    );
};

const FloatingColumn = ({ speed = 20, children, className }) => (
    <motion.div
        animate={{ y: [0, "-50%"] }}
        transition={{
            duration: speed,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop"
        }}
        style={{ willChange: "transform" }}
        className={className}
    >
        {children}
        {children}
    </motion.div>
);

const Login = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState('admin');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.username && formData.password) {
            setIsLoading(true);
            try {
                const res = await login({
                    username: formData.username,
                    password: formData.password,
                    role: selectedRole,
                    loginTime: new Date().toISOString(),
                });

                if (!res.success) {
                    setError(res.message || "Invalid username or password");
                    toast.error(res.message || "Invalid username or password");
                    setIsLoading(false);
                } else {
                    toast.success('Login successful!');
                }
            } catch (err) {
                const errorMsg = "Something went wrong. Please try again.";
                setError(errorMsg);
                toast.error(errorMsg);
                setIsLoading(false);
            }
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4 relative overflow-hidden">

            {/* ... Background Code ... */}
            <div className="absolute inset-0 flex gap-6 justify-center opacity-40 select-none pointer-events-none -skew-y-6 scale-110">
                <FloatingColumn speed={40} className="flex flex-col gap-6 w-64">
                    {[1, 2, 3, 4, 5].map(i => <BackgroundCard key={i} index={i} />)}
                </FloatingColumn>
                <FloatingColumn speed={55} className="flex flex-col gap-6 w-64 pt-20">
                    {[1, 2, 3, 4, 5].map(i => <BackgroundCard key={i} index={i + 10} className="h-40" />)}
                </FloatingColumn>
                <FloatingColumn speed={45} className="flex flex-col gap-6 w-64">
                    {[1, 2, 3, 4, 5].map(i => <BackgroundCard key={i} index={i + 20} />)}
                </FloatingColumn>
                <FloatingColumn speed={60} className="flex flex-col gap-6 w-64 pt-32 hidden md:flex">
                    {[1, 2, 3, 4, 5].map(i => <BackgroundCard key={i} index={i + 30} className="h-32" />)}
                </FloatingColumn>
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent pointer-events-none" />

            <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/50 relative z-10">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-50">
                        <img src="/favicon.png" alt="Atelier logo" srcSet="/favicon.png" className="object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
                    <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
                </div>

                {/* Role Toggle */}
                <div className="bg-gray-100/50 p-1 rounded-lg flex mb-6 border border-gray-200/50">
                    <button
                        type="button"
                        onClick={() => setSelectedRole('admin')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${selectedRole === 'admin'
                            ? 'bg-white text-[#4361ee] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedRole('technician')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${selectedRole === 'technician'
                            ? 'bg-white text-[#4361ee] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Technician
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                        <div className="relative">
                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="input-field !pl-10 bg-white/50 focus:bg-white transition-colors"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field !pl-10 !pr-10 bg-white/50 focus:bg-white transition-colors"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4361ee] transition-colors"
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-primary py-3 text-lg shadow-lg shadow-blue-200/50 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Signing in...
                            </>
                        ) : 'Sign In'}
                    </button>
                </form>

                <div className="mt-4 pt-4 border-t border-gray-200/50 text-center">
                    <p className="text-xs text-gray-400">
                        Application Developed and maintained by
                        <Link to={"https://ateliertechnologysolutions.com/"} target='_blank' className="font-medium text-gray-600 ml-1 mt-1 block">Atelier Technology Solutions</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
