import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const fetchJobStats = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const { data } = await api.get('/jobs/stats/overview');
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchJobStats();
        } else {
            setStats(null);
        }
    }, [isAuthenticated, fetchJobStats]);

    const addJob = async (jobData) => {
        setLoading(true);
        try {
            const config = jobData instanceof FormData ? { headers: { 'Content-Type': undefined } } : {};
            const { data } = await api.post('/jobs', jobData, config);
            setLastUpdated(Date.now());
            fetchJobStats();
            return data;
        } catch (error) {
            console.error("Error creating job:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateJob = async (jobId, updates) => {
        setLoading(true);
        try {
            const config = updates instanceof FormData ? { headers: { 'Content-Type': undefined } } : {};
            const { data } = await api.put(`/jobs/${jobId}`, updates, config);
            setLastUpdated(Date.now());
            fetchJobStats();
            return data;
        } catch (error) {
            console.error("Error updating job:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteJob = async (jobId) => {
        setLoading(true);
        try {
            await api.delete(`/jobs/${jobId}`);
            setLastUpdated(Date.now());
            fetchJobStats();
        } catch (error) {
            console.error("Error deleting job:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const getJobById = async (jobId) => {
        try {
            const { data } = await api.get(`/jobs/${jobId}`);
            return data;
        } catch (error) {
            console.error("Error fetching job:", error);
            return null;
        }
    };

    const value = {
        stats,
        loading,
        lastUpdated,
        addJob,
        updateJob,
        deleteJob,
        getJobById,
        fetchJobStats,
    };

    return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
