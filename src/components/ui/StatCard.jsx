import { FiArrowRight } from 'react-icons/fi';

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
        <div className={`card p-6 flex flex-col justify-between h-40 relative overflow-hidden group ${className}`}>
            <div className="flex justify-between items-start z-10">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {onClick && (
                    <button onClick={onClick} className="text-slate-300 hover:text-slate-500 transition-colors">
                        <FiArrowRight className="w-5 h-5" />
                    </button>
                )}
            </div>
            <div className="z-10">
                <h3 className="text-3xl font-bold text-slate-800 mb-1">{value}</h3>
                <p className="text-slate-500 text-sm font-medium">{label}</p>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-current opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none ${decorationColor}`}></div>
        </div>
    );
};

export default StatCard;
