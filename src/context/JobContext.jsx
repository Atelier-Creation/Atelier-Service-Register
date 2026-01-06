import { createContext, useContext, useState, useEffect } from 'react';

const JobContext = createContext(null);

export const useJobs = () => {
    const context = useContext(JobContext);
    if (!context) {
        throw new Error('useJobs must be used within a JobProvider');
    }
    return context;
};

export const JobProvider = ({ children }) => {
    const [jobs, setJobs] = useState([]);
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        // Load jobs from localStorage
        const storedJobs = localStorage.getItem('jobs');
        if (storedJobs) {
            try {
                setJobs(JSON.parse(storedJobs));
            } catch (error) {
                console.error('Error loading jobs:', error);
            }
        }

        // Load customers from localStorage
        const storedCustomers = localStorage.getItem('customers');
        if (storedCustomers) {
            try {
                setCustomers(JSON.parse(storedCustomers));
            } catch (error) {
                console.error('Error loading customers:', error);
            }
        }
    }, []);

    const saveJobs = (updatedJobs) => {
        setJobs(updatedJobs);
        localStorage.setItem('jobs', JSON.stringify(updatedJobs));
    };

    const saveCustomers = (updatedCustomers) => {
        setCustomers(updatedCustomers);
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    };

    const addJob = (job) => {
        const newJob = {
            ...job,
            id: `JOB${Date.now()}`,
            createdAt: new Date().toISOString(),
        };

        const updatedJobs = [...jobs, newJob];
        saveJobs(updatedJobs);

        // Add customer if new
        const existingCustomer = customers.find(c => c.phone === job.phone);
        if (!existingCustomer) {
            const newCustomer = {
                id: `CUST${Date.now()}`,
                name: job.customerName,
                phone: job.phone,
                totalJobs: 1,
                createdAt: new Date().toISOString(),
            };
            saveCustomers([...customers, newCustomer]);
        } else {
            const updatedCustomers = customers.map(c =>
                c.phone === job.phone
                    ? { ...c, totalJobs: (c.totalJobs || 0) + 1 }
                    : c
            );
            saveCustomers(updatedCustomers);
        }

        return newJob;
    };

    const updateJob = (jobId, updates) => {
        const updatedJobs = jobs.map(job =>
            job.id === jobId ? { ...job, ...updates, updatedAt: new Date().toISOString() } : job
        );
        saveJobs(updatedJobs);
    };

    const deleteJob = (jobId) => {
        const updatedJobs = jobs.filter(job => job.id !== jobId);
        saveJobs(updatedJobs);
    };

    const getJobById = (jobId) => {
        return jobs.find(job => job.id === jobId);
    };

    const searchJobs = (query) => {
        const lowerQuery = query.toLowerCase();
        return jobs.filter(job =>
            job.id.toLowerCase().includes(lowerQuery) ||
            job.customerName.toLowerCase().includes(lowerQuery) ||
            job.phone.includes(query) ||
            job.device.toLowerCase().includes(lowerQuery)
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
        addJob,
        updateJob,
        deleteJob,
        getJobById,
        searchJobs,
        getJobStats,
    };

    return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};
