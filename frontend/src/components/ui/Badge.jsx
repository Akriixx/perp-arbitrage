import { cn } from "../../utils/cn";
import { motion } from "framer-motion";

const variants = {
    profit: "bg-profit-green/15 text-profit-green border-profit-green/20",
    loss: "bg-loss-red/15 text-loss-red border-loss-red/20",
    neutral: "bg-gray-500/15 text-gray-400 border-gray-500/20",
    brand: "bg-brand-primary/15 text-brand-primary border-brand-primary/20",
    warning: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20",
};

export function Badge({ variant = "neutral", children, className, animate = false }) {
    const Component = animate ? motion.span : "span";

    return (
        <Component
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-sm",
                variants[variant],
                className
            )}
            {...(animate && {
                initial: { scale: 0.9, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                transition: { type: "spring", stiffness: 500, damping: 30 }
            })}
        >
            {children}
        </Component>
    );
}
