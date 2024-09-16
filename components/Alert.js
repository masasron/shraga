import cn from "utils/cn"
import * as React from "react"
import { cva } from "class-variance-authority"

const alertVariants = cva(
    "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
    {
        variants: {
            variant: {
                default: "bg-background text-foreground",
                destructive: "border-red-500 text-red-500 [&>svg]:text-red-500",
                warning: "border-yellow-500 text-yellow-500 [&>svg]:text-yellow-500",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const Alert = React.forwardRef((props, ref) => {
    const { className, variant, ...rest } = props;
    return (
        <div
            ref={ref}
            role="alert"
            className={cn(alertVariants({ variant }), className)}
            {...rest}
        />
    )
});
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef((props, ref) => {
    const { className, ...rest } = props;
    return (
        <h5
            ref={ref}
            className={cn("mb-1 font-medium leading-none tracking-tight", className)}
            {...rest}
        />
    )
});
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef((props, ref) => {
    const { className, ...rest } = props;
    return (
        <div
            ref={ref}
            className={cn("text-sm [&_p]:leading-relaxed", className)}
            {...rest}
        />
    )
});
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }