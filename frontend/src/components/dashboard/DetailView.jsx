import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import SpreadChart from './SpreadChart';
import ProfitCalculator from './ProfitCalculator';

export default function DetailView({ pair, data, onClose }) {
    if (!data) return null;

    const spread = data.realSpread || 0;

    // Find exchange names and prices
    // Assuming 'bestAskEx' means Buy from (Ask)
    // 'bestBidEx' means Sell to (Bid)
    const exchangeAndPrice = {
        buyEx: data.bestAskEx || 'Lighter',
        buyPrice: data.bestAsk || 0,
        sellEx: data.bestBidEx || 'Vest',
        sellPrice: data.bestBid || 0
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Main Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-7xl bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >

                {/* Header Bar */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-[#1a1a1a]">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-blue-500">{pair}</span>
                        <span className="text-gray-500 font-light">|</span>
                        <span className="text-gray-300 text-lg">SPREAD ANALYSIS & EXECUTION</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content using Grid */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0f1117]">

                    {/* Chart Section (70% on desktop -> col-span-8) */}
                    <div className="lg:col-span-8 flex flex-col min-h-[400px]">
                        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-1 flex-1 shadow-lg">
                            <SpreadChart pair={pair} liveData={data} />
                        </div>
                    </div>

                    {/* Calculator Section (30% on desktop -> col-span-4) */}
                    <div className="lg:col-span-4 min-h-[400px]">
                        <ProfitCalculator
                            spread={spread}
                            pair={pair}
                            exchangeAndPrice={exchangeAndPrice}
                        />
                    </div>
                </div>

            </motion.div>
        </div>
    );
}
