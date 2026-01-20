/**
 * Spinner Component
 */

import { RefreshCw } from 'lucide-react';

export function Spinner({ size = 'md', className = '' }) {
    const sizeClass = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    }[size];

    return (
        <RefreshCw className={`${sizeClass} animate-spin ${className}`} />
    );
}

export default Spinner;
