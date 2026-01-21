import { memo } from 'react';
import { OpportunityCard } from './OpportunityCard';

const MarketGrid = memo(function MarketGrid({ pairs, onExecute }) {
    if (pairs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-[#888888] bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a]">
                <p className="text-xl font-bold text-white mb-2">No opportunities found</p>
                <p className="text-sm">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
            {pairs.map((pair, index) => (
                <OpportunityCard
                    key={pair.symbol}
                    pair={pair}
                    onExecute={onExecute}
                />
            ))}
        </div>
    );
});

export default MarketGrid;
