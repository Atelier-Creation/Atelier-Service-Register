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
    value,
    label,
    icon: Icon,
    color = "bg-blue-100 text-blue-600",
    decorationColor = "text-blue-600",
    onClick,
    className = ""
}) => {
    return (
        <div className={`card p-4 flex flex-col justify-between relative overflow-hidden group ${className}`}>
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
