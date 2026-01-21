import { ArrowUpRight, Flame, TrendingUp, AlertTriangle } from 'lucide-react';

export default function ProfitCalculator({ spread, pair, exchangeAndPrice }) {
    // Configuration
    const MARGIN_PER_SIDE = 1000;

    const PAIR_LEVERAGE = {
        'BTC': 50,
        'ETH': 50,
        'SOL': 20,
        'PAXG': 50,
        'MYX': 3,
        'LIT': 5,
        'RESOLV': 3,
        'BERA': 5
    };

    const getLeverage = (symbol) => {
        return PAIR_LEVERAGE[symbol] || 10; // Default 10x
    };

    const leverage = getLeverage(pair);
    const positionSize = MARGIN_PER_SIDE * leverage;

    // New Simplified Calculation
    // Profit = Margin * Leverage * (Spread / 100)
    // Which is equivalent to: Position Size * (Spread / 100)
    // Fees are ignored as requested

    const grossProfit = positionSize * (spread / 100);
    const netProfit = grossProfit; // Fees removed
    const roi = (netProfit / (MARGIN_PER_SIDE * 2)) * 100;
    const isProfitable = netProfit > 0;

    return (
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-gray-800 rounded-xl p-6 shadow-2xl h-full flex flex-col">

            {/* Header */}
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
                <span>💰</span> Profit Calculator
            </h3>

            {/* Parameters */}
            <div className="space-y-4 flex-1">

                {/* Config Section */}
                <div className="bg-gray-800/50 rounded-lg p-3 text-sm border border-gray-700">
                    <div className="flex justify-between text-gray-400 mb-1">
                        <span>Margin per side</span>
                        <span className="text-white font-mono">${MARGIN_PER_SIDE.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                        <span>Total Capital</span>
                        <span className="text-white font-mono">${(MARGIN_PER_SIDE * 2).toLocaleString()}</span>
                    </div>
                </div>

                {/* Leverage Section */}
                <div className="bg-gray-800/50 rounded-lg p-3 text-sm border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Pair Leverage</span>
                        <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded">{leverage}x</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                        <span className="text-gray-400">Position Size</span>
                        <span className="text-white font-mono font-bold">${positionSize.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500 text-right mt-1">(per side)</div>
                </div>

                {/* Opportunity */}
                <div className="bg-gray-800/50 rounded-lg p-3 text-sm border border-gray-700">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Spread</span>
                        <span className={`font-bold ${spread > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {spread.toFixed(2)}%
                        </span>
                    </div>
                    <div className="text-xs space-y-1 font-mono text-gray-500">
                        <div>LONG  {exchangeAndPrice.buyEx} @ ${exchangeAndPrice.buyPrice?.toFixed(2)}</div>
                        <div>SHORT {exchangeAndPrice.sellEx} @ ${exchangeAndPrice.sellPrice?.toFixed(2)}</div>
                    </div>
                </div>

            </div>

            {/* Bottom Result */}
            <div className="mt-6">
                <div className={`p-4 rounded-xl border-2 mb-4 ${isProfitable
                    ? 'bg-green-500/10 border-green-500/50'
                    : 'bg-red-500/10 border-red-500/50'
                    }`}>
                    {isProfitable ? (
                        <>
                            <div className="flex justify-between text-sm text-gray-400 mb-3">
                                <span>Gross Profit</span>
                                <span>+${grossProfit.toFixed(2)}</span>
                            </div>

                            <div className="border-t border-dashed border-gray-600 my-2"></div>

                            <div className="flex justify-between items-end">
                                <span className="text-lg font-bold text-green-400">
                                    NET PROFIT
                                </span>
                                <div className="text-right">
                                    <div className="text-2xl font-black flex items-center gap-2 text-green-400">
                                        +${netProfit.toFixed(2)}
                                        <Flame className="w-6 h-6 animate-pulse" />
                                    </div>
                                    <div className="text-sm font-medium text-gray-400">
                                        ROI: {roi.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-2">
                            <div className="flex items-center justify-center gap-2 text-red-500 font-bold text-xl mb-1">
                                <AlertTriangle className="w-6 h-6" />
                                NOT PROFITABLE
                            </div>
                            <p className="text-sm text-red-300/80">
                                Negative spread ({spread.toFixed(2)}%). <br />
                                Wait for opportunity or check other pairs.
                            </p>
                        </div>
                    )}
                </div>

                {isProfitable ? (
                    <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
                        <span>Take Position</span>
                        <ArrowUpRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button disabled className="w-full bg-gray-700 text-gray-400 font-bold py-3 rounded-lg cursor-not-allowed">
                        No Opportunity
                    </button>
                )}
            </div>

        </div>
    );
}
