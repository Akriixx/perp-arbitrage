/**
 * Badge Component
 */

export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
    const baseClasses = 'inline-flex items-center font-bold uppercase rounded';

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-[10px]',
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm'
    }[size];

    const variantClasses = {
        default: 'bg-gray-500/20 text-gray-400',
        success: 'bg-green-500/20 text-green-500',
        danger: 'bg-red-500/20 text-red-500',
        warning: 'bg-yellow-500/20 text-yellow-500',
        info: 'bg-blue-500/20 text-blue-500',
        long: 'bg-green-500/20 text-green-500',
        short: 'bg-red-500/20 text-red-500'
    }[variant];

    return (
        <span className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}>
            {children}
        </span>
    );
}

export default Badge;
