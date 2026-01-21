import React from 'react';
import { Bell, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import CryptoIcon from '../dashboard/CryptoIcon';

export default function ScannerAlarmModal({ pair, onConfirm }) {
    if (!pair) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#06070a]/90 backdrop-blur-sm animate-in fade-in duration-300"></div>

            {/* Modal */}
            <div className="relative bg-[#1a1d24] border border-yellow-500/50 rounded-[32px] p-8 max-w-md w-full shadow-2xl shadow-yellow-500/10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <div className="bg-yellow-500/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-4 ring-yellow-500/10">
                    <AlertTriangle className="w-10 h-10 text-yellow-500 animate-pulse" />
                </div>

                <h2 className="text-3xl font-black text-center text-white mb-2 leading-tight">
                    SCANNER ALERT!
                </h2>

                <p className="text-gray-400 text-center text-sm font-medium mb-8 leading-relaxed">
                    The arbitrage spread for <span className="text-white font-bold">{pair.symbol}</span> has exceeded your threshold!
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#0f1117] rounded-2xl p-4 border border-gray-800 flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Live Spread</span>
                        <span className="text-2xl font-mono font-bold text-yellow-400">{pair.realSpread?.toFixed(2)}%</span>
                    </div>
                    <div className="bg-[#0f1117] rounded-2xl p-4 border border-gray-800 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-1">
                            <CryptoIcon symbol={pair.symbol} className="w-4 h-4" />
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{pair.symbol}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                            <span className="text-emerald-400">{pair.bestBidEx}</span>
                            <TrendingUp className="w-3 h-3 text-gray-600" />
                            <span className="text-red-400">{pair.bestAskEx}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onConfirm}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-yellow-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    <CheckCircle2 className="w-6 h-6" />
                    ACKNOWLEDGE - STOP ALARM
                </button>
            </div>
        </div>
    );
}
