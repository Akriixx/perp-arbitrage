import React, { useCallback } from 'react';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import CryptoIcon from './CryptoIcon';
import ExchangeIcon from './ExchangeIcon';
import AlertBadge from './AlertBadge';
import ProfitBadge from './ProfitBadge';
import SettingsPopup from './SettingsPopup';
import { PAIR_LEVERAGE } from '../../utils/constants';

const OpportunityCard = React.memo(({
    row,
    index,
    onSelect,
    settingsOpenFor,
    setSettingsOpenFor,
    getAlertThreshold,
    hasCustomThreshold,
    updateThreshold,
    minSpread,
    margin
}) => {
    const spread = row.realSpread || 0;
    const buyEx = row.bestAskEx || 'Unknown';
    const sellEx = row.bestBidEx || 'Unknown';

    const threshold = getAlertThreshold(row.symbol);
    const isAlerting = hasCustomThreshold && spread >= threshold;
    const isSettingsOpen = settingsOpenFor === row.symbol;

    const leverage = PAIR_LEVERAGE[row.symbol] || 10;
    const estProfit = (margin * leverage) * (spread / 100);
    const isNegligible = estProfit < 1;

    const handleSettingsToggle = useCallback((e) => {
        e.stopPropagation();
        setSettingsOpenFor(isSettingsOpen ? null : row.symbol);
    }, [isSettingsOpen, row.symbol, setSettingsOpenFor]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => onSelect(row)}
            className={`
                border rounded-[20px] shadow-xl hover:-translate-y-1 transition-all duration-200 group cursor-pointer relative overflow-visible p-6
                ${isAlerting
                    ? 'bg-[#1a1a1a] border-yellow-500/50 shadow-yellow-500/20 ring-1 ring-yellow-500/30'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] hover:shadow-black/60 hover:border-blue-500/30'
                }
            `}
        >
            <AlertBadge isAlerting={isAlerting} />

            {/* Alert Settings Button */}
            <button
                onClick={handleSettingsToggle}
                className={`absolute top-3 right-3 z-10 p-2 rounded-xl transition-all duration-300 ${isAlerting || hasCustomThreshold
                    ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 shadow-lg shadow-yellow-500/10'
                    : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'
                    }`}
            >
                <Bell className={`w-4 h-4 ${hasCustomThreshold ? 'fill-current' : ''}`} />
            </button>

            <SettingsPopup
                symbol={row.symbol}
                threshold={threshold}
                isOpen={isSettingsOpen}
                onClose={() => setSettingsOpenFor(null)}
                onUpdate={updateThreshold}
                hasCustomThreshold={hasCustomThreshold}
            />

            {/* Header: Icon + Name */}
            <div className="flex items-center gap-3 mb-2">
                <CryptoIcon
                    symbol={row.symbol}
                    className="w-12 h-12 transform group-hover:scale-110 transition-transform duration-300"
                />
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight leading-tight">{row.symbol}</h2>
                    <div className="flex items-center gap-1.5 text-[#9ca3af] text-[10px] font-medium mt-0.5">
                        <ExchangeIcon exchange={buyEx} className="w-3 h-3" />
                        <span>{buyEx}</span>
                        <span className="text-blue-500">→</span>
                        <ExchangeIcon exchange={sellEx} className="w-3 h-3" />
                        <span>{sellEx}</span>
                    </div>
                </div>
            </div>

            <ProfitBadge
                spread={spread}
                estProfit={estProfit}
                isAlerting={isAlerting}
                isNegligible={isNegligible}
            />

            {/* Strategy Details */}
            <div className="space-y-2">
                <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                        <ExchangeIcon exchange={buyEx} className="w-4 h-4" />
                        <span className="text-emerald-400 font-medium text-[10px]">Long</span>
                    </div>
                    <span className="text-white font-mono text-xs">${row.bestAsk?.toFixed(5)}</span>
                </div>

                <div className="flex justify-between items-center bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                        <ExchangeIcon exchange={sellEx} className="w-4 h-4" />
                        <span className="text-red-400 font-medium text-[10px]">Short</span>
                    </div>
                    <span className="text-white font-mono text-xs">${row.bestBid?.toFixed(5)}</span>
                </div>
            </div>
        </motion.div>
    );
}, (prev, next) => {
    // Custom comparison to handle the "fresh object reference" issue in App.jsx
    return (
        prev.row.symbol === next.row.symbol &&
        prev.row.realSpread === next.row.realSpread &&
        prev.row.bestBid === next.row.bestBid &&
        prev.row.bestAsk === next.row.bestAsk &&
        prev.settingsOpenFor === next.settingsOpenFor &&
        prev.hasCustomThreshold === next.hasCustomThreshold &&
        prev.margin === next.margin
    );
});

export default OpportunityCard;
