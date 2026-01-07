const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={`animate-pulse rounded bg-slate-200 ${className}`}
            {...props}
        />
    );
};

export { Skeleton };
