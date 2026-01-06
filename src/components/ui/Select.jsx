import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

/**
 * Reusable Select component inspired by shadcn/ui.
 * 
 * @param {Object} props
 * @param {string|number} props.value - Currently selected value
 * @param {function} props.onChange - Callback when selection changes
 * @param {Array<string|Object>} props.options - Array of options. If objects, use {label, value}. If strings, value and label are same.
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Classes for the wrapper div
 * @param {string} props.triggerClassName - Classes for the button trigger
 */
const Select = ({ value, onChange, options, placeholder = "Select...", className = "", triggerClassName = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        const val = typeof option === 'object' ? option.value : option;
        onChange({ target: { value: val } }); // Mock event object to be compatible with typical e.target.value handlers if needed, or just pass val.
        // Actually best to pass raw value to act like a controlled component, but standard <select> onChange sends event.
        // To be drop-in replacement, let's just call onChange(val) and I will update usage.
        setIsOpen(false);
    };

    // Find label
    let selectedLabel = placeholder;
    if (value !== undefined && value !== null) {
        const found = options.find(opt => (typeof opt === 'object' ? opt.value == value : opt == value));
        if (found) {
            selectedLabel = typeof found === 'object' ? found.label : found;
        }
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-50 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName}`}
            >
                <span className="truncate">{selectedLabel}</span>
                <FiChevronDown className={`h-4 w-4 shrink-0 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-1 m-1 max-h-60 w-full min-w-[120px] overflow-auto rounded-md border border-slate-200 bg-white text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95">
                    <div className="p-1">
                        {options.map((option, index) => {
                            const optValue = typeof option === 'object' ? option.value : option;
                            const optLabel = typeof option === 'object' ? option.label : option;
                            const isSelected = optValue == value;

                            return (
                                <div
                                    key={index}
                                    onClick={() => {
                                        // If parent expects event:
                                        // onChange({ target: { value: optValue, name: ... } })
                                        // But cleaner to just pass value
                                        onChange(optValue);
                                        setIsOpen(false);
                                    }}
                                    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 cursor-pointer ${isSelected ? 'bg-slate-50 font-medium' : ''}`}
                                >
                                    {isSelected && (
                                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-slate-900">
                                            <FiCheck className="h-4 w-4" />
                                        </span>
                                    )}
                                    <span className="truncate">{optLabel}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Select;
