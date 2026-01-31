import { RefreshCw, PlusCircle, LayoutDashboard, Briefcase, Bell, BarChart3 } from 'lucide-react';

export default function DashboardHeader({
    activeTab,
    setActiveTab,
    refreshInterval,
    setRefreshInterval,
    refresh,
    isLoading,
    onAddPosition,
    monitoredCount,
    onOpenAlarms
}) {
    return (
        <header className="pt-8 pb-6 px-6 mb-4 backdrop-blur-md sticky top-0 z-30 bg-[#0f1117]/80 flex justify-start">
            {/* Tabs Navigation Centered */}
            <div className="flex items-center bg-[#1a1d24] p-1.5 rounded-2xl border border-gray-800 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-1.5 px-3 border-r border-gray-800/50 mr-1">
                    <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                        className="bg-transparent text-gray-400 text-[10px] font-bold py-1 focus:outline-none cursor-pointer appearance-none"
                    >
                        <option value={1000}>1s</option>
                        <option value={3000}>3s</option>
                        <option value={5000}>5s</option>
                        <option value={10000}>10s</option>
                    </select>

                    <button
                        onClick={refresh}
                        disabled={isLoading}
                        className={`p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all ${isLoading ? 'opacity-50' : 'active:scale-90'}`}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <button
                    onClick={() => setActiveTab('scanner')}
                    className={`
                        flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                        ${activeTab === 'scanner' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}
                    `}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Scanner
                </button>
                <button
                    onClick={() => setActiveTab('positions')}
                    className={`
                        flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                        ${activeTab === 'positions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}
                    `}
                >
                    <Briefcase className="w-4 h-4" />
                    Positions
                </button>
                <button
                    onClick={() => setActiveTab('trackRecord')}
                    className={`
                        flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                        ${activeTab === 'trackRecord' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300'}
                    `}
                >
                    <BarChart3 className="w-4 h-4" />
                    Suivi
                </button>

                <button
                    onClick={onOpenAlarms}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors mr-2 ml-2"
                    title="Manage Active Alarms"
                >
                    <Bell className="w-4 h-4" />
                    {monitoredCount > 0 && (
                        <span className="text-xs font-bold text-blue-400">({monitoredCount})</span>
                    )}
                </button>

                <div className="h-6 w-[1px] bg-gray-800/50 mx-2"></div>

                {/* Add Position Button */}
                <button
                    onClick={onAddPosition}
                    className="flex items-center gap-2 bg-emerald-600/90 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[11px] font-black shadow-lg shadow-emerald-500/10 transition-all active:scale-95 ml-1"
                >
                    <PlusCircle className="w-4 h-4" />
                    ADD POSITION
                </button>
            </div>
        </header>
    );
}
