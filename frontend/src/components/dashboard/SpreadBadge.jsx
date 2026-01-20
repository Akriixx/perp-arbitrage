/**
 * SpreadBadge Component
 * Displays spread with color coding
 */

import { formatSpread, getSpreadColor, getSpreadBg } from '../../utils/formatters';

export function SpreadBadge({ spread }) {
    const colorClass = getSpreadColor(spread);
    const bgClass = getSpreadBg(spread);

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded ${bgClass} ${colorClass} font-medium text-sm`}>
            {formatSpread(spread)}
        </span>
    );
}

export default SpreadBadge;
