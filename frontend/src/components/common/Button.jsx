/**
 * Button Component
 */

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick,
    className = '',
    ...props
}) {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors';

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-5 py-2.5 text-base gap-2'
    }[size];

    const variantClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50',
        secondary: 'bg-[#252836] hover:bg-[#2f3344] text-white border border-[#3a3f4b]',
        ghost: 'text-gray-400 hover:text-white hover:bg-[#252836]',
        active: 'bg-blue-600/20 text-white border border-blue-600/50'
    }[variant];

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

export default Button;
