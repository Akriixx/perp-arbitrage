import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpreadChart } from './SpreadChart';
import { ProfitCalculator } from './ProfitCalculator';

export function ExpandableRow({ pair, isOpen, onClose }) {
    const [period, setPeriod] = useState('24h');
    const [historyData, setHistoryData] = useState(null);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Poll history when opened
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = () => {
            setIsLoading(prev => prev === false ? false : true); // Keep loading true only on first load
            fetch(`/api/spread-history?pair=${pair.symbol}&period=${period}`)
                .then(res => res.json())
                .then(data => {
                    setHistoryData(data.data);
                    setStats(data.stats);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch history:", err);
                    setIsLoading(false);
                });
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);

        return () => clearInterval(interval);
    }, [isOpen, period, pair.symbol]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden bg-app-card/30 border-b border-app-border"
                >
                    <div className="p-6 flex flex-col lg:flex-row gap-6 min-h-[400px] h-auto">
                        {/* Left: Chart (70%) */}
                        <div className="flex-1 min-w-0">
                            <SpreadChart
                                pair={pair.symbol}
                                data={historyData}
                                stats={stats || {}}
                                period={period}
                                onPeriodChange={setPeriod}
                                isLoading={isLoading}
                            />
                        </div>

                        {/* Right: Calculator (30%) */}
                        <div className="w-full lg:w-[350px] shrink-0">
                            <ProfitCalculator
                                pair={pair}
                                spread={pair.realSpread}
                                bestBid={pair.bestBid}
                                bestAsk={pair.bestAsk}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
