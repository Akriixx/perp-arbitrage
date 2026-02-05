import React, { useRef, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

const SettingsPopup = ({
    symbol,
    threshold,
    isOpen,
    onClose,
    onUpdate,
    hasCustomThreshold
}) => {
    const inputRef = useRef(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-10 right-2 z-20 w-64 bg-[#1f2937] border border-gray-700 rounded-xl shadow-2xl p-4"
        >
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-blue-400" />
                    Alerts for {symbol}
                </h3>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="flex flex-col gap-3">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Threshold (%)</label>
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="number"
                            defaultValue={threshold}
                            step="0.1"
                            min="0.01"
                            max="10"
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onUpdate(symbol, e.currentTarget.value);
                            }}
                        />
                        <button
                            onClick={() => {
                                if (inputRef.current) {
                                    onUpdate(symbol, inputRef.current.value);
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded-lg text-xs font-bold"
                        >
                            Save
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => onUpdate(symbol, null)}
                    className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-white transition-colors self-start opacity-70 hover:opacity-100"
                >
                    <BellOff className="w-3 h-3" />
                    Désactiver l'alerte
                </button>
            </div>
        </div>
    );
};

export default React.memo(SettingsPopup);
