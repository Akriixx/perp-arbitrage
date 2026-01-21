import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export function Card({ className, children, ...props }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "glass-card rounded-xl p-6 relative overflow-hidden",
                className
            )}
            {...props}
        >
            {/* Subtle Gradient Glow at top right */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-[50px] rounded-full pointer-events-none -mr-10 -mt-10" />

            {children}
        </motion.div>
    );
}

export function CardHeader({ title, subtitle, className }) {
    return (
        <div className={cn("mb-4", className)}>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
        </div>
    );
}
