import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import { Loader2 } from 'lucide-react';

export default function SpreadChart({ pair, liveData }) {
    const [period, setPeriod] = useState('24h');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Use live value if available, otherwise historical or 0
    // liveData comes from App -> DetailView -> here (Updates based on dashboard refresh interval)
    const currentSpread = liveData?.realSpread ?? data?.stats?.current;

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/spread-history?pair=${pair}&period=${period}`);
            if (!res.ok) throw new Error('Failed to fetch history');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [pair, period]);

    const periods = ['24h', '7d', '14d', 'all'];

    const formatXAxis = (tickItem) => {
        const date = new Date(tickItem);
        if (period === '24h') {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        if (period === '7d' || period === '14d') {
            return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-sm z-50">
                    <p className="text-gray-400 mb-1">{new Date(label).toLocaleString()}</p>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-400 font-bold text-lg">{d.spread.toFixed(4)}%</span>
                        <span className="text-xs text-gray-500">Spread</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                        <span className="text-gray-500">Lighter:</span>
                        <span className="text-white">${d.lighter_price?.toFixed(2)}</span>
                        <span className="text-gray-500">Vest:</span>
                        <span className="text-white">${d.vest_price?.toFixed(2)}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const StatItem = ({ label, value, suffix, colorClass = "text-white" }) => (
        <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">{label}</span>
            <span className={`text-xl font-bold ${colorClass}`}>
                {value}{suffix}
            </span>
        </div>
    );

    return (
        <div className="bg-[#0f111a] h-full flex flex-col p-4 rounded-lg">
            {/* Top Bar: Title & Controls */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-white font-bold text-xl flex items-baseline gap-2">
                        {pair.split('-')[0]} <span className="text-gray-500 text-sm font-normal uppercase">SPREAD (VEST VS LIGHTER)</span>
                    </h3>
                </div>

                <div className="flex items-center gap-1 bg-[#1a1d26] p-1 rounded-md">
                    {periods.map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${period === p
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {p.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Row */}
            {data?.stats && (
                <div className="flex gap-12 mb-6 border-b border-white/5 pb-4 px-1">
                    <StatItem
                        label="Current Spread"
                        value={currentSpread !== undefined && currentSpread !== null ? Number(currentSpread).toFixed(4) : '-'}
                        suffix="%"
                        colorClass="text-emerald-400"
                    />
                    <StatItem
                        label={`Average (${period})`}
                        value={data.stats.average ? Number(data.stats.average).toFixed(4) : '-'}
                        suffix="%"
                        colorClass="text-white"
                    />
                    <StatItem
                        label="Min"
                        value={data.stats.min ? Number(data.stats.min).toFixed(4) : '-'}
                        suffix="%"
                        colorClass="text-red-400"
                    />
                    <StatItem
                        label="Max"
                        value={data.stats.max ? Number(data.stats.max).toFixed(4) : '-'}
                        suffix="%"
                        colorClass="text-emerald-400"
                    />
                    <StatItem
                        label={`Percentile (${period})`}
                        value={data.stats.percentile}
                        suffix="%"
                        colorClass="text-white"
                    />
                </div>
            )}

            {/* Chart */}
            <div className="flex-1 min-h-[300px] relative">
                {loading && !data && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#0f111a]/80">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                )}

                {data?.data && (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={(() => {
                            if (!data.data || data.data.length === 0 || !liveData) return data.data;
                            // Create a shallow copy of the array to avoid mutating state
                            const newData = [...data.data];
                            // Update the last point with real-time data
                            const lastIndex = newData.length - 1;
                            newData[lastIndex] = {
                                ...newData[lastIndex],
                                spread: liveData.realSpread,
                                // Update individual prices if available in liveData
                                lighter_price: liveData.bestAsk || newData[lastIndex].lighter_price,
                                vest_price: liveData.bestBid || newData[lastIndex].vest_price
                            };
                            return newData;
                        })()}>
                            <defs>
                                <linearGradient id="colorSpread" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={formatXAxis}
                                stroke="#4b5563"
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                minTickGap={50}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#4b5563"
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                                domain={['auto', 'auto']}
                                unit="%"
                                axisLine={false}
                                tickLine={false}
                                dx={-10}
                                tickFormatter={(value) => value.toFixed(4)}
                            />
                            <Tooltip content={<CustomTooltip />} />

                            {/* 0% Baseline */}
                            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />

                            {/* Average Line */}
                            <ReferenceLine
                                y={data.stats.average}
                                stroke="#10b981"
                                strokeDasharray="3 3"
                                label={{ value: 'Avg', fill: '#10b981', fontSize: 10, position: 'right' }}
                            />

                            <Area
                                type="monotone"
                                dataKey="spread"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorSpread)"
                                connectNulls={true}
                                activeDot={{ r: 4, stroke: 'white', strokeWidth: 2, fill: '#3b82f6' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}


