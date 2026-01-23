import { FiArrowRight } from 'react-icons/fi';

const formatStatValue = (val) => {
    const strVal = String(val).replace(/,/g, '');
    const match = strVal.match(/^([^\d-]*)(-?\d*\.?\d+)(.*)$/);
    if (!match) return val;

    const [, prefix, numStr, suffix] = match;
    const num = parseFloat(numStr);

    if (isNaN(num)) return val;
    if (Math.abs(num) < 1000) return val;

    let formattedNum = num;
    let unit = '';

    if (Math.abs(num) >= 1000000) {
        formattedNum = (num / 1000000).toFixed(1);
        unit = 'M';
    } else {
        formattedNum = (num / 1000).toFixed(1);
        unit = 'k';
    }

    return `${prefix}${formattedNum.replace(/\.0$/, '')}${unit}${suffix}`;
};

const StatCard = ({
    title,
    value,
    label,
    icon: Icon,
    color = "bg-blue-100 text-blue-600",
    decorationColor = "text-blue-600",
    onClick,
    className = "",
    tooltip = null
}) => {
    return (
        <div className={`card p-4 flex flex-col justify-between relative overflow-hidden group ${className}`}>
            {/* Title with Info Icon */}
            {title && (
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</h4>
                    {tooltip && (
                        <div className="relative group/tooltip">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-help">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            {/* Tooltip */}
                            <div className="absolute right-0 top-6 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
                                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                                {tooltip}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 z-10">
                    <div className={`rounded-xl ${typeof Icon === 'string' ? '' : `p-3 ${color}`}`}>
                        {typeof Icon === 'string' ? (
                            <img src={Icon} alt={label} className="w-12 h-12 object-contain" />
                        ) : (
                            <Icon className="w-6 h-6" />
                        )}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">{formatStatValue(value)}</h3>
                </div>
                {onClick && (
                    <button
                        onClick={onClick}
                        className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-200 transform group-hover:translate-x-1 transition-all z-20"
                    >
                        <FiArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="z-10 mt-2">
                <p className="text-gray-500 text-sm ">{label}</p>
            </div>

            {/* Subtle background decoration */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 bg-current opacity-[0.02] rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none ${decorationColor}`}></div>
        </div>
    );
};

export default StatCard;
