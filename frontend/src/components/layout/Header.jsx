import { RefreshCw, Bell, ChevronDown } from 'lucide-react'

function Header({
    refreshIntervals,
    currentInterval,
    onIntervalChange,
    lastUpdate,
    onRefresh,
    isLoading,
    isConnected,
    onClearFilters
}) {
    const formatTime = (date) => {
        if (!date) return '--:--:--'
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }

    return (
        <header className="h-16 bg-[#1a1d29] border-b border-[#252836] flex items-center justify-between px-6">
            {/* Left: Logo & Nav */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <span className="text-white font-semibold text-lg">Arbitrage Dashboard</span>
                </div>

                <nav className="flex items-center gap-1">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600/20 border border-blue-600/50 rounded-lg">
                        Dashboard
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#252836] rounded-lg transition-colors">
                        Positions
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#252836] rounded-lg transition-colors">
                        Metrics
                    </button>
                </nav>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-4">
                {/* Refresh Interval Selector */}
                <div className="relative">
                    <select
                        value={currentInterval}
                        onChange={(e) => onIntervalChange(Number(e.target.value))}
                        className="appearance-none bg-[#252836] text-white text-sm px-3 py-2 pr-8 rounded-lg border border-[#3a3f4b] focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                        {refreshIntervals.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Last Update */}
                <span className="text-sm text-gray-400">
                    Updated: <span className="text-white">{formatTime(lastUpdate)}</span>
                </span>

                {/* Refresh Button */}
                <button
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>

                {/* Clear Filters */}
                <button
                    onClick={onClearFilters}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#252836] rounded-lg transition-colors"
                >
                    Clear Filters
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-yellow-500 hover:bg-[#252836] rounded-lg transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
                </button>

                {/* Connection Status */}
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>
        </header>
    )
}

export default Header
