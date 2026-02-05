import React from 'react';
import { TrendingUp } from 'lucide-react';

const ProfitBadge = ({ spread, estProfit, isAlerting, isNegligible }) => {
    return (
        <div className={`
            border rounded-xl text-center py-2 px-4 my-4 flex flex-col items-center gap-1
            ${isAlerting
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-blue-500/10 border-blue-500/30 group-hover:bg-blue-500/15'
            }
        `}>
            <span className={`font-bold text-lg ${isAlerting ? 'text-yellow-400' : 'text-blue-400'}`}>
                Spread {spread.toFixed(2)}%
            </span>

            {/* Est. Profit Badge (Static Margin) */}
            {estProfit > 0 && (
                <span className={`text-xs font-black tracking-wide flex items-center gap-1 ${isNegligible ? 'text-gray-500' : 'text-emerald-400'}`}>
                    {!isNegligible && <TrendingUp className="w-3 h-3" />}
                    Est. +${estProfit.toFixed(2)}
                </span>
            )}
        </div>
    );
};

export default React.memo(ProfitBadge);
