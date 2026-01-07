import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState('admin');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Login Form Data:', formData); // Debug log
        if (formData.username && formData.password) {
            login({
                username: formData.username,
                password: formData.password,
                role: selectedRole,
                loginTime: new Date().toISOString(),
            });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">

                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-50">
                        {/* <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg> */}
                        <img src="/favicon.png" alt="Atelier logo" srcset="/favicon.png" className="object-cover" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
                    <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
                </div>

                {/* Role Toggle */}
                <div className="bg-slate-50 p-1 rounded-lg flex mb-6 border border-slate-100">
                    <button
                        type="button"
                        onClick={() => setSelectedRole('admin')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${selectedRole === 'admin'
                            ? 'bg-white text-[#4361ee] shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Admin
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedRole('technician')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${selectedRole === 'technician'
                            ? 'bg-white text-[#4361ee] shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Technician
                    </button>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                        <div className="relative">
                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="input-field !pl-10"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field !pl-10 !pr-10"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4361ee] transition-colors"
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="w-full btn-primary py-3 text-lg shadow-lg shadow-blue-200">
                        Sign In
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        Demo Credentials:
                        <span className="font-medium text-slate-600 ml-1">admin / admin</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
