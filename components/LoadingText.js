import cn from "utils/cn";

const LoadingText = ({ children, className, ...props }) => {
    return (
        <div className={cn("relative select-none text-4xl", className)} {...props}>
            <span className="relative text-[14px] md:text-sm text-gray-700">{children}</span>
            <span className={cn("absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-glare", props.stop ? "opacity-0" : "")}></span>
        </div>
    );
};

export default LoadingText;