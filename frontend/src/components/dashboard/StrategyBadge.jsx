/**
 * StrategyBadge Component
 * Displays LONG/SHORT strategy recommendations
 */

import { Badge } from '../common/Badge';

export function StrategyBadge({ bestBidEx, bestAskEx }) {
    const hasStrategy = bestBidEx && bestAskEx && bestBidEx !== bestAskEx;

    if (!hasStrategy) {
        return <span className="text-gray-600">-</span>;
    }

    return (
        <div className="flex flex-col gap-1">
            <Badge variant="long" size="xs">
                LONG {bestAskEx}
            </Badge>
            <Badge variant="short" size="xs">
                SHORT {bestBidEx}
            </Badge>
        </div>
    );
}

export default StrategyBadge;
