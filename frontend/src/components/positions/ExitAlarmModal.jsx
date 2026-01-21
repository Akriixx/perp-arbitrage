import React from 'react';
import { Bell, CheckCircle2, TrendingDown } from 'lucide-react';

export default function ExitAlarmModal({ position, onConfirm }) {
    if (!position) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#06070a]/90 backdrop-blur-sm animate-in fade-in duration-300"></div>

            {/* Modal */}
            <div className="relative bg-[#1a1d24] border border-emerald-500/50 rounded-[32px] p-8 max-w-md w-full shadow-2xl shadow-emerald-500/10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="bg-emerald-500/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/10">
                    <Bell className="w-10 h-10 text-emerald-400 animate-bounce" />
                </div>

                <h2 className="text-3xl font-black text-center text-white mb-2 leading-tight">
                    EXIT TARGET REACHED!
                </h2>

                <p className="text-gray-400 text-center text-sm font-medium mb-8 leading-relaxed">
                    The arbitrage spread for <span className="text-white font-bold">{position.symbol}</span> has converged to your target of <span className="text-emerald-400 font-bold">≤ {position.exitTargetSpread}%</span>.
                </p>

                <div className="bg-[#0f1117] rounded-2xl p-6 border border-gray-800 mb-8 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Current Opportunity</span>
                    <div className="flex items-center gap-3 text-lg font-bold">
                        <span className="text-emerald-400">{position.buyEx}</span>
                        <TrendingDown className="w-4 h-4 text-gray-600" />
                        <span className="text-red-400">{position.sellEx}</span>
                    </div>
                </div>

                <button
                    onClick={onConfirm}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    <CheckCircle2 className="w-6 h-6" />
                    I'M ON IT - STOP ALARM
                </button>
            </div>
        </div>
    );
}
