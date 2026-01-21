import { memo, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Star, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, formatSpread, getSpreadColor, getSpreadBg } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { ExpandableRow } from './ExpandableRow';

// Grid Layout Definition
const GRID_COLS = "grid-cols-[48px_1.2fr_1.5fr_1.2fr_1fr_1fr_1fr]";

// Memoized PriceCell
// Memoized PriceCell
const PriceCell = memo(function PriceCell({ price, isBestBid, isBestAsk, bestEx }) {
    const bid = price?.bid || 0;
    const ask = price?.ask || 0;

    if (!price || (bid === 0 && ask === 0)) {
        return <span className="text-text-muted text-sm font-mono text-center block">-</span>;
    }

    return (
        <div className="flex flex-col items-center gap-1 font-mono">
            <div className={cn(
                "text-sm font-semibold transition-all duration-300 px-1.5 rounded",
                isBestBid ? "text-profit-green drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "text-white"
            )}>
                {formatPrice(bid)}
            </div>
            <div className={cn(
                "text-xs font-medium transition-all duration-300 px-1.5 rounded",
                isBestAsk ? "text-loss-red drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" : "text-text-muted"
            )}>
                {formatPrice(ask)}
            </div>
        </div>
    );
});

// Memoized Row
const MarketRow = memo(function MarketRow({ pair, isFavorite, onToggleFavorite, style, isEven }) {
    const spread = pair.realSpread ?? -999;
    const hasStrategy = pair.bestBidEx && pair.bestAskEx && pair.bestBidEx !== pair.bestAskEx;
    const isProfitable = spread > 0;

    return (
        <div
            style={style}
            className={cn(
                "w-full grid items-center border-b border-app-border transition-colors hover:bg-white/5",
                GRID_COLS,
                isEven ? "bg-transparent" : "bg-white/[0.02]"
            )}
        >
            {/* Favorite Star */}
            <div className="px-4 py-3 flex justify-center">
                <button
                    onClick={() => onToggleFavorite(pair.symbol)}
                    className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-yellow-500 transition-all active:scale-90"
                >
                    <Star
                        className={cn("w-4 h-4 transition-all", isFavorite && "text-yellow-500 fill-yellow-500")}
                    />
                </button>
            </div>

            {/* Pair Symbol */}
            <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 flex items-center justify-center text-[10px] font-bold text-white border border-white/10 shrink-0">
                        {pair.symbol.substring(0, 3)}
                    </div>
                    <div className="min-w-0">
                        <div className="text-white font-bold text-sm tracking-tight truncate">{pair.symbol}</div>
                        <div className="text-[10px] text-text-muted font-medium uppercase">Perpetual</div>
                    </div>
                </div>
            </div>

            {/* Spread */}
            <div className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "text-base font-bold font-mono tracking-tight",
                        isProfitable ? "text-profit-green" : "text-loss-red"
                    )}>
                        {formatSpread(spread)}
                    </div>
                    {isProfitable && <TrendingUp className="w-4 h-4 text-profit-green" />}
                    {!isProfitable && spread !== -999 && <TrendingDown className="w-4 h-4 text-loss-red" />}
                </div>
                {isProfitable && (
                    <div className="h-1 w-24 bg-app-dark rounded-full mt-1.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(spread * 50, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-profit-green shadow-[0_0_10px_#10b981]"
                        />
                    </div>
                )}
            </div>

            {/* Strategy */}
            <div className="px-4 py-3">
                {hasStrategy ? (
                    <div className="flex flex-col gap-1.5 items-start">
                        <Badge variant="profit" className="shadow-sm text-[10px] px-2">
                            L: {pair.bestAskEx}
                        </Badge>
                        <Badge variant="loss" className="shadow-sm text-[10px] px-2">
                            S: {pair.bestBidEx}
                        </Badge>
                    </div>
                ) : (
                    <span className="text-text-muted text-xs italic opacity-50">-</span>
                )}
            </div>

            {/* Exchange Prices */}
            <div className="px-2 py-3"><PriceCell price={pair.lighter} isBestBid={pair.bestBidEx === 'LIGHTER'} isBestAsk={pair.bestAskEx === 'LIGHTER'} /></div>
            <div className="px-2 py-3"><PriceCell price={pair.paradex} isBestBid={pair.bestBidEx === 'PARADEX'} isBestAsk={pair.bestAskEx === 'PARADEX'} /></div>
            <div className="px-2 py-3"><PriceCell price={pair.vest} isBestBid={pair.bestBidEx === 'VEST'} isBestAsk={pair.bestAskEx === 'VEST'} /></div>
        </div>
    );
});

// Header Component
const MarketHeader = ({ onSort, sortField, sortDirection }) => (
    <div className={cn("grid border-b border-app-border bg-app-card/95 backdrop-blur z-10 sticky top-0 text-xs font-bold text-text-secondary uppercase tracking-wider", GRID_COLS)}>
        <div className="px-4 py-4"></div>
        <div className="px-4 py-4">Asset</div>
        <div
            className="px-4 py-4 cursor-pointer hover:text-white transition-colors flex items-center gap-2 group"
            onClick={() => onSort('realSpread')}
        >
            Spread
            <div className="opacity-0 group-hover:opacity-50 transition-opacity">
                {sortField === 'realSpread' ? (
                    sortDirection === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                ) : <ArrowUpDown className="w-3 h-3" />}
            </div>
        </div>
        <div className="px-4 py-4">Strategy</div>
        <div className="px-4 py-4 text-center">Lighter</div>
        <div className="px-4 py-4 text-center">Paradex</div>
        <div className="px-4 py-4 text-center">Vest</div>
    </div>
);

// Main Component
function MarketTable({ pairs, favorites, onToggleFavorite, sortField, sortDirection, onSort }) {
    const parentRef = useRef(null);
    const favoritesSet = useMemo(() => new Set(favorites), [favorites]);
    const shouldVirtualize = pairs.length > 50;
    const [expandedPair, setExpandedPair] = useState(null);



    const toggleExpand = (symbol) => {
        setExpandedPair(prev => prev === symbol ? null : symbol);
    };

    const rowVirtualizer = useVirtualizer({
        count: pairs.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72,
        overscan: 10,
        enabled: shouldVirtualize
    });

    if (pairs.length === 0) {
        // ... (empty state)
        return (
            <div className="flex flex-col items-center justify-center h-96 text-text-muted bg-app-card/50 rounded-2xl border border-app-border backdrop-blur-sm">
                <p className="text-xl font-bold text-white mb-2">No pairs found</p>
                <p className="text-sm text-text-secondary">Try adjusting filters</p>
            </div>
        );
    }

    return (
        <div className="bg-app-card/50 backdrop-blur-md rounded-2xl border border-app-border shadow-2xl overflow-hidden flex flex-col h-full ring-1 ring-white/5">
            <MarketHeader onSort={onSort} sortField={sortField} sortDirection={sortDirection} />

            <div
                ref={parentRef}
                className="flex-1 overflow-auto custom-scrollbar relative"
            >
                {shouldVirtualize ? (
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const pair = pairs[virtualRow.index];
                            return (
                                <MarketRow
                                    key={pair.symbol}
                                    pair={pair}
                                    isFavorite={favoritesSet.has(pair.symbol)}
                                    // wrapper handling required for virtualization + expansion which is complex.
                                    // For now, disabling expansion in virtualized mode or treating it as just row
                                    onToggleFavorite={onToggleFavorite}
                                    isEven={virtualRow.index % 2 === 0}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="w-full">
                        {pairs.map((pair, index) => (
                            <div key={pair.symbol} className="flex flex-col transition-colors">
                                <div
                                    onClick={(e) => {
                                        // Prevent expansion when clicking favorite star or other buttons
                                        if (e.target.closest('button')) return;
                                        toggleExpand(pair.symbol);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <MarketRow
                                        pair={pair}
                                        isFavorite={favoritesSet.has(pair.symbol)}
                                        onToggleFavorite={onToggleFavorite}
                                        isEven={index % 2 === 0}
                                        style={{
                                            height: '72px',
                                            position: 'relative'
                                        }}
                                    />
                                </div>
                                <ExpandableRow
                                    pair={pair}
                                    isOpen={expandedPair === pair.symbol}
                                    onClose={() => setExpandedPair(null)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(MarketTable);
