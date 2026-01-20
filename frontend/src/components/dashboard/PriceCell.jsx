/**
 * PriceCell Component
 * Displays bid/ask prices with highlighting for best prices
 */

import { formatPrice } from '../../utils/formatters';

export function PriceCell({ price, isBestBid, isBestAsk }) {
    if (!price || (price.bid === 0 && price.ask === 0)) {
        return <span className="text-gray-600">-</span>;
    }

    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className={`text-sm font-medium ${isBestBid ? 'text-red-500' : 'text-white'}`}>
                {formatPrice(price.bid)}
            </span>
            <span className={`text-xs ${isBestAsk ? 'text-green-500' : 'text-gray-500'}`}>
                {formatPrice(price.ask)}
            </span>
        </div>
    );
}

export default PriceCell;
