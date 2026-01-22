import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const JobContext = createContext(null);

export const useJobs = () => {
    const context = useContext(JobContext);
    if (!context) {
        throw new Error('useJobs must be used within a JobProvider');
    }
    return context;
};

export const JobProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            setJobs([]);
            setCustomers([]);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [jobsRes, customersRes] = await Promise.all([
                    api.get('/jobs'),
                    api.get('/customers')
                ]);
                setJobs(jobsRes.data);
                setCustomers(customersRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isAuthenticated]);

    const addJob = async (jobData) => {
        try {
            const config = jobData instanceof FormData ? { headers: { 'Content-Type': undefined } } : {};
            const { data } = await api.post('/jobs', jobData, config);
            setJobs(prev => [data, ...prev]);

            // Optimistically update or re-fetch customers? 
            // The backend updates customers automatically. We should probably re-fetch customers or update list if we have the data.
            // For simplicity, let's re-fetch customers in background or just add if new.
            // Actually, simply adding the job is enough for the UI for now. To be safe, re-fetch customers:
            api.get('/customers').then(res => setCustomers(res.data));

            return data;
        } catch (error) {
            console.error("Error creating job:", error);
            throw error;
        }
    };

    const updateJob = async (jobId, updates) => {
        try {
            // Optimistic update
            // setJobs(prev => prev.map(job => job.jobId === jobId ? { ...job, ...updates } : job)); // Be careful with IDs

            const config = updates instanceof FormData ? { headers: { 'Content-Type': undefined } } : {};
            const { data } = await api.put(`/jobs/${jobId}`, updates, config);
            setJobs(prev => prev.map(job => job.jobId === jobId || job._id === jobId || job.id === jobId ? data : job));
        } catch (error) {
            console.error("Error updating job:", error);
            // Revert?
        }
    };

    const deleteJob = async (jobId) => {
        try {
            await api.delete(`/jobs/${jobId}`);
            setJobs(prev => prev.filter(job => job.jobId !== jobId && job._id !== jobId && job.id !== jobId));
        } catch (error) {
            console.error("Error deleting job:", error);
        }
    };

    const getJobById = (jobId) => {
        return jobs.find(job => job.jobId === jobId || job.id === jobId || job._id === jobId);
    };

    const searchJobs = (query) => {
        const lowerQuery = query.toLowerCase();
        return jobs.filter(job =>
            (job.jobId && job.jobId.toLowerCase().includes(lowerQuery)) ||
            (job.customerName && job.customerName.toLowerCase().includes(lowerQuery)) ||
            (job.phone && job.phone.includes(query)) ||
            (job.device && job.device.toLowerCase().includes(lowerQuery))
        );
    };

    const getJobStats = () => {
        const today = new Date().toDateString();
        const todayJobs = jobs.filter(job =>
            new Date(job.createdAt).toDateString() === today
        );

        const statusCounts = jobs.reduce((acc, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            return acc;
        }, {});

        const totalEarnings = jobs
            .filter(job => job.status === 'delivered')
            .reduce((sum, job) => sum + (parseFloat(job.totalAmount) || 0), 0);

        const pendingPayments = jobs
            .filter(job => job.status !== 'delivered')
            .reduce((sum, job) => sum + (parseFloat(job.totalAmount) - parseFloat(job.advanceAmount) || 0), 0);

        return {
            total: jobs.length,
            today: todayJobs.length,
            statusCounts,
            totalEarnings,
            pendingPayments,
        };
    };

    const value = {
        jobs,
        customers,
        loading,
        addJob,
        updateJob,
        deleteJob,
        getJobById,
        searchJobs,
        getJobStats,
    };

    return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
