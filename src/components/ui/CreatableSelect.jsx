import { useState, useEffect, useRef } from 'react';
import { FiChevronDown, FiPlus } from 'react-icons/fi';

const CreatableSelect = ({ label, options = [], value, onChange, placeholder, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        // Filter options based on input
        if (!inputValue) {
            setFilteredOptions(options);
        } else {
            const lowerInput = inputValue.toLowerCase();
            const exactMatch = options.some(opt => opt.toLowerCase() === lowerInput);

            // If user is typing something not in list, we still show the list filtered
            // but we also treat the input as the value.
            const filtered = options.filter(opt =>
                opt.toLowerCase().includes(lowerInput)
            );
            setFilteredOptions(filtered);
        }
    }, [inputValue, options]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // On blur without selection, keep the typed value (Creatable behavior)
                // Just ensure parent is updated if they typed but didn't click
                if (inputValue !== value) {
                    onChange(inputValue);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onChange, inputValue, value]);

    const handleSelect = (option) => {
        setInputValue(option);
        onChange(option);
        setIsOpen(false);
    };

    const handleInputChange = (e) => {
        const newVal = e.target.value;
        setInputValue(newVal);
        onChange(newVal); // Update parent immediately as they type
        setIsOpen(true);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 outline-none focus:ring-2 focus:ring-[#4361ee]/40 focus:border-[#4361ee] transition-all duration-200 pr-10"
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    <FiChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-[100] mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <div
                                key={index}
                                onClick={() => handleSelect(option)}
                                className={`px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer ${option === value ? 'bg-blue-50 text-blue-600' : ''}`}
                            >
                                {option}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">New</span>
                            Create "{inputValue}"
                        </div>
                    )}
                    {/* Explicit Create Option if input doesn't match exactly and not empty */}
                    {inputValue && !filteredOptions.includes(inputValue) && filteredOptions.length > 0 && (
                        <div className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 cursor-pointer border-t border-gray-50 flex items-center gap-2"
                            onClick={() => setIsOpen(false)} // Already filtered/typed
                        >
                            <FiPlus className="w-3 h-3" /> Create "{inputValue}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreatableSelect;
