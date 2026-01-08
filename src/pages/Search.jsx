import { useState } from 'react';
import { useJobs } from '../context/JobContext';
import { FiSearch, FiPhone, FiUser, FiFileText, FiClock } from 'react-icons/fi';

const Search = () => {
    const { searchJobs } = useJobs();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchType, setSearchType] = useState('all');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const results = searchJobs(searchQuery);
            setSearchResults(results);
        }
    };

    const getStatusClass = (status) => {
        const classes = {
            received: 'status-received',
            'in-progress': 'status-in-progress',
            waiting: 'status-waiting',
            ready: 'status-ready',
            delivered: 'status-delivered',
        };
        return classes[status] || 'status-received';
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Smart Search</h1>
                <p className="text-gray-500">Find any job by ID, customer name, or phone number</p>
            </div>

            {/* Search Box */}
            <div className="card p-6 shadow-lg border-blue-100">
                <form onSubmit={handleSearch} className="space-y-6">
                    <div className="flex gap-2 justify-center">
                        {[
                            { value: 'all', label: 'All Fields', icon: FiSearch },
                            { value: 'phone', label: 'Phone', icon: FiPhone },
                            { value: 'customer', label: 'Customer', icon: FiUser },
                            { value: 'jobId', label: 'Job ID', icon: FiFileText },
                        ].map((type) => {
                            const Icon = type.icon;
                            return (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setSearchType(type.value)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${searchType === type.value
                                            ? 'bg-[#4361ee] text-white shadow-md shadow-blue-200'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {type.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative max-w-2xl mx-auto">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-14 pr-4 text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                            placeholder={`Type to search by ${searchType === 'all' ? 'anything' : searchType}...`}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-2 bottom-2 bg-[#4361ee] text-white px-6 rounded-lg font-medium hover:bg-[#3f37c9] transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </form>
            </div>

            {/* Results */}
            {searchResults.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-semibold text-gray-700">Found {searchResults.length} results</h3>
                    </div>
                    {searchResults.map((job) => (
                        <div key={job.id} className="card p-6 flex flex-col sm:flex-row gap-6 hover:border-blue-200 transition-colors">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-gray-100 text-gray-600 font-mono text-xs px-2 py-1 rounded">#{job.id}</span>
                                        <h3 className="font-bold text-gray-800 text-lg">{job.customerName}</h3>
                                    </div>
                                    <span className={`status-badge ${getStatusClass(job.status)}`}>
                                        {job.status.replace('-', ' ')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-gray-500 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <FiPhone className="w-4 h-4" />
                                        {job.phone}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <FiClock className="w-4 h-4" />
                                        {new Date(job.receivedDate).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <p className="text-gray-700 font-medium text-sm mb-1">{job.device}</p>
                                    <p className="text-gray-500 text-sm">{job.issue}</p>
                                </div>
                            </div>

                            <div className="flex flex-row sm:flex-col justify-between items-end border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 min-w-[140px]">
                                <div className="text-right">
                                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Balance</p>
                                    <p className="text-2xl font-bold text-gray-800">
                                        ₹{((parseFloat(job.totalAmount) || 0) - (parseFloat(job.advanceAmount) || 0)).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-400 text-xs">Total Bill</p>
                                    <p className="text-gray-600 font-medium">₹{parseFloat(job.totalAmount).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : searchQuery && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiSearch className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-gray-800 font-medium text-lg">No matches found</h3>
                    <p className="text-gray-500">Check your spelling or try different keywords</p>
                </div>
            )}
        </div>
    );
};

export default Search;
