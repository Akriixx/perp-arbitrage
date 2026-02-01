import React from 'react';
import { ACTIVE_EXCHANGES_LIST, EXCHANGES } from '../../utils/constants';
import { Layers, RefreshCw } from 'lucide-react';

const Sidebar = React.memo(({ enabledExchanges, setEnabledExchanges, isLoading }) => {
    const exchanges = ACTIVE_EXCHANGES_LIST;

    const toggleExchange = (ex) => {
        setEnabledExchanges(prev => ({ ...prev, [ex]: !prev[ex] }));
    };

    const getDisplayName = (id) => {
        const found = EXCHANGES.find(e => e.id === id);
        return found ? found.name : id;
    };

    return (
        <aside className="w-72 bg-[#13161d] border-r border-gray-800/50 flex flex-col shrink-0 h-screen sticky top-0">
            {/* Header / Logo Section */}
            <div className="p-8 border-b border-gray-800/50">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <RefreshCw className={`w-6 h-6 text-white ${isLoading ? 'animate-spin' : ''}`} />
                    </div>
                    <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400">
                        ARBITRAGE SCANNER
                    </h1>
                </div>
                <p className="text-gray-500 text-[10px] font-medium ml-1">Real-time cross-exchange opportunities</p>
            </div>

            <div className="px-6 pt-8 pb-4">
                <div className="flex items-center gap-3 opacity-50">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="font-black text-[10px] tracking-widest text-gray-200">EXCHANGES</span>
                </div>
            </div>

            <div className="p-4 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                {exchanges.map((ex) => {
                    const isActive = enabledExchanges[ex];
                    return (
                        <button
                            key={ex}
                            onClick={() => toggleExchange(ex)}
                            className={`
                                w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group
                                ${isActive
                                    ? 'bg-blue-600/10 border border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.15)]'
                                    : 'bg-transparent border border-transparent hover:bg-gray-800/50 hover:border-gray-700'
                                }
                            `}
                        >
                            <span className={`
                                text-sm font-bold uppercase tracking-wide transition-colors
                                ${isActive ? 'text-blue-100' : 'text-gray-500 group-hover:text-gray-300'}
                            `}>
                                {getDisplayName(ex)}
                            </span>

                            <div className={`
                                w-2 h-2 rounded-full transition-all duration-300
                                ${isActive ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : 'bg-gray-700'}
                            `} />
                        </button>
                    );
                })}
            </div>

            <div className="p-4 border-t border-gray-800/50">
                <div className="text-[10px] text-gray-600 font-medium text-center">
                    v1.0.0 • Connected
                </div>
            </div>
        </aside>
    );
});

export default Sidebar;
