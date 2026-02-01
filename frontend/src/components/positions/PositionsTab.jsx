import React, { useMemo } from 'react';
import { TrendingDown, Trash2, Clock, ArrowRight, Bell, Edit2, Check, X, Coins, TrendingUp, Info } from 'lucide-react';
import CryptoIcon from '../dashboard/CryptoIcon';
import ExchangeIcon from '../dashboard/ExchangeIcon';
import { EXCHANGES } from '../../utils/constants';

const PositionRow = React.memo(({ pos, pairs, onRemove, onUpdate, editingId, setEditingId, tempValue, setTempValue }) => {
    const getLiveSpread = (symbol) => {
        const pair = pairs.find(p => p.symbol === symbol);
        return pair ? pair.realSpread : null;
    };

    const getDisplayName = (id) => {
        const found = EXCHANGES.find(e => e.id === id.toLowerCase());
        return found ? found.name : id.toUpperCase();
    };

    const calculatePnL = (pos) => {
        if (!pos.size || !pos.entryBuyPrice || !pos.entrySellPrice) return null;

        const pair = pairs.find(p => p.symbol === pos.symbol);
        if (!pair) return null;

        const buyExKey = pos.buyEx.toLowerCase();
        const sellExKey = pos.sellEx.toLowerCase();

        const currentBid = pair[buyExKey]?.bid;
        const currentAsk = pair[sellExKey]?.ask;

        if (!currentBid || !currentAsk) return null;

        const pnl = (currentBid - pos.entryBuyPrice + pos.entrySellPrice - currentAsk) * pos.size;
        return pnl;
    };

    const handleStartEdit = (pos) => {
        setEditingId(pos.id);
        setTempValue(pos.exitTargetSpread.toString());
    };

    const handleSave = (id) => {
        onUpdate(id, { exitTargetSpread: parseFloat(tempValue) });
        setEditingId(null);
    };

    const liveSpread = getLiveSpread(pos.symbol);
    const isTargetReached = liveSpread !== null && liveSpread <= pos.exitTargetSpread;
    const isEditing = editingId === pos.id;
    const pnl = calculatePnL(pos);

    return (
        <div
            className={`
                bg-[#1a1d24] border rounded-3xl p-6 shadow-xl relative group transition-all duration-300
                ${isTargetReached
                    ? 'border-emerald-500/50 shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                    : 'border-gray-800 hover:border-gray-700'
                }
            `}
        >
            {isTargetReached && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <Bell className="w-3.5 h-3.5" />
                    Exit Target Reached
                </div>
            )}

            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <CryptoIcon symbol={pos.symbol} className="w-14 h-14" />
                        <div className="absolute -bottom-1 -right-1 bg-[#1a1d24] p-1 rounded-lg">
                            <ExchangeIcon exchange={pos.buyEx} className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white leading-none mb-2">{pos.symbol}</h2>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                Opened {new Date(pos.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {pos.size > 0 && (
                                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold bg-blue-500/10 px-2 py-0.5 rounded-md w-fit">
                                    <Coins className="w-3 h-3" />
                                    Size: {pos.size}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onRemove(pos.id)}
                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0f1117] rounded-2xl p-4 border border-gray-800/50">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Entry Spread</span>
                    <span className="text-xl font-mono font-bold text-gray-300">{pos.entrySpread?.toFixed(2)}%</span>
                </div>
                <div className={`rounded-2xl p-4 border transition-all ${isTargetReached ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-[#0f1117] border-gray-800/50'}`}>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1">Live Spread</span>
                    <span className={`text-xl font-mono font-bold ${isTargetReached ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {liveSpread !== null ? `${liveSpread.toFixed(2)}%` : '---'}
                    </span>
                </div>
            </div>

            {/* NEW: uPNL Section */}
            {pnl !== null && (
                <div className="mb-6 bg-[#0f1117]/80 rounded-2xl p-4 border border-gray-800/50 flex items-center justify-between relative group/pnl">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${pnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {pnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">Est. Net Profit</span>
                            <span className={`text-base font-black ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">Exit Slippage</span>
                            <Info className="w-3 h-3 text-gray-600" />
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">
                            Incl. Bid-Ask spread
                        </span>
                    </div>

                    {/* Simple Tooltip on hover */}
                    <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl text-[10px] text-gray-400 hidden group-hover/pnl:block z-50">
                        Ce profit inclut les coûts induits par les spreads internes des exchanges. C'est le montant <b>net</b> si tu fermais maintenant.
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-gray-500 font-medium">Trade Details</span>
                    <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-emerald-400">{getDisplayName(pos.buyEx)}</span>
                        <ArrowRight className="w-3 h-3 text-gray-600" />
                        <span className="text-red-400">{getDisplayName(pos.sellEx)}</span>
                    </div>
                </div>

                <div className={`bg-[#0f1117]/50 rounded-2xl p-4 border border-gray-800/30 flex items-center justify-between transition-colors ${isEditing ? 'border-blue-500/50 bg-blue-500/5' : ''}`}>
                    <div className="flex-1">
                        <span className="text-[10px] text-gray-500 block mb-1 uppercase tracking-widest font-bold">Exit Target</span>
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <span className="text-white font-bold opacity-50">≤</span>
                                <input
                                    autoFocus
                                    type="number"
                                    step="0.01"
                                    className="bg-gray-800 border border-blue-500/50 rounded-lg px-2 py-1 text-white font-bold text-lg w-24 focus:outline-none"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave(pos.id);
                                        if (e.key === 'Escape') setEditingId(null);
                                    }}
                                />
                                <span className="text-white font-bold opacity-50">%</span>
                                <div className="flex items-center gap-1 ml-auto">
                                    <button onClick={() => handleSave(pos.id)} className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30">
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center group/target">
                                <span className="text-lg font-bold text-white">≤ {pos.exitTargetSpread}%</span>
                                <button
                                    onClick={() => handleStartEdit(pos)}
                                    className="ml-3 p-1 text-gray-600 hover:text-blue-400 opacity-0 group-hover/target:opacity-100 transition-all"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                    {!isEditing && (
                        isTargetReached ? (
                            <div className="bg-emerald-500 text-black font-extrabold px-4 py-2 rounded-xl text-xs uppercase shadow-lg shadow-emerald-500/20">
                                Close Trade
                            </div>
                        ) : (
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-500 block uppercase tracking-widest font-bold">Distance</span>
                                <span className="text-sm font-mono text-gray-400">
                                    {liveSpread !== null ? (liveSpread - pos.exitTargetSpread).toFixed(2) : '--'}%
                                </span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    // Optimization: only re-render if essential data changed
    const prevPair = prev.pairs.find(p => p.symbol === prev.pos.symbol);
    const nextPair = next.pairs.find(p => p.symbol === next.pos.symbol);
    return (
        prev.pos.id === next.pos.id &&
        prev.pos.exitTargetSpread === next.pos.exitTargetSpread &&
        prev.editingId === next.editingId &&
        prevPair?.realSpread === nextPair?.realSpread &&
        prevPair?.vest?.bid === nextPair?.vest?.bid && // Simple check for price stability
        prevPair?.paradex?.ask === nextPair?.paradex?.ask
    );
});

export default function PositionsTab({ positions, pairs, onRemove, onUpdate }) {
    const [editingId, setEditingId] = React.useState(null);
    const [tempValue, setTempValue] = React.useState('');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">Active Positions</h1>
                    <p className="text-gray-500 text-sm font-medium">Track your arbitrage trades and exit targets in real-time.</p>
                </div>
            </div>

            {positions.length === 0 ? (
                <div className="bg-[#1a1d24] border border-gray-800 rounded-3xl p-20 text-center">
                    <div className="bg-gray-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <TrendingDown className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-300 mb-2">No active positions</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        Switch back to the Scanner to find opportunities and add them here to monitor their convergence.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {positions.map(pos => (
                        <PositionRow
                            key={pos.id}
                            pos={pos}
                            pairs={pairs}
                            onRemove={onRemove}
                            onUpdate={onUpdate}
                            editingId={editingId}
                            setEditingId={setEditingId}
                            tempValue={tempValue}
                            setTempValue={setTempValue}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
