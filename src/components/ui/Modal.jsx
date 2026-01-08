import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative z-50 w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col sm:mx-0 mx-4 animate-in zoom-in-95 duration-200 ${className}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm rounded-t-2xl z-10">
                    <h3 className="text-lg font-semibold text-gray-800 tracking-tight">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
                    >
                        <FiX className="w-5 h-5" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
