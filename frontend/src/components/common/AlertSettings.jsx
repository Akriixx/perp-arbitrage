import { useState } from 'react';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';

export default function AlertSettings({ minSpread, setMinSpread, soundEnabled, setSoundEnabled }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-300 text-sm
          ${soundEnabled
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-750'}
        `}
            >
                {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                <span className="hidden sm:inline">Alerts</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-72 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl z-20 p-4 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-blue-500" />
                            Alert Settings
                        </h3>

                        {/* Sound Toggle */}
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-400 text-sm">Sound Effect</span>
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`p-2 rounded-lg transition-colors ${soundEnabled
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-gray-800 text-gray-500'
                                    }`}
                            >
                                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Threshold Slider */}
                        <div className="mb-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm">Min Spread</span>
                                <span className="text-blue-400 font-mono font-bold">{minSpread}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.1"
                                max="5.0"
                                step="0.1"
                                value={minSpread}
                                onChange={(e) => setMinSpread(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Notify when spread exceeds this value.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
