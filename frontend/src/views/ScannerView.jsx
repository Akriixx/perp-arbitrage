import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import OpportunityCard from '../components/dashboard/OpportunityCard';

export default function ScannerView({
    sortedData,
    isLoading,
    error,
    marginPerSide,
    setMarginPerSide,
    pairThresholds,
    updateThreshold,
    getAlertThreshold,
    minSpread,
    onSelectPair
}) {
    const [settingsOpenFor, setSettingsOpenFor] = useState(null);

    return (
        <>
            {/* MARGIN SELECTION BAR */}
            <div className="flex items-center justify-start gap-4 mb-10 pl-2">
                <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Margin Per Side</span>
                <div className="bg-[#1a1a1a] p-1 rounded-xl flex gap-1 border border-[#2a2a2a]">
                    {[500, 1000, 2500, 5000].map(val => (
                        <button
                            key={val}
                            onClick={() => setMarginPerSide(val)}
                            className={`
                    px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200
                    ${marginPerSide === val
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }
                  `}
                        >
                            ${val}
                        </button>
                    ))}
                </div>
            </div>

            {!isLoading && sortedData.length === 0 && !error && (
                <div className="text-center py-32 opacity-50">
                    <p className="text-2xl font-light">No opportunities found.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence mode="popLayout">
                    {sortedData.map((row, i) => (
                        <OpportunityCard
                            key={row.symbol || i}
                            row={row}
                            index={i}
                            margin={marginPerSide}
                            onSelect={onSelectPair}
                            settingsOpenFor={settingsOpenFor}
                            setSettingsOpenFor={setSettingsOpenFor}
                            getAlertThreshold={getAlertThreshold}
                            hasCustomThreshold={pairThresholds.hasOwnProperty(row.symbol)}
                            updateThreshold={updateThreshold}
                            minSpread={minSpread}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}
