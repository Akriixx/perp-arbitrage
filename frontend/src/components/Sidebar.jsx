import { Search, Star, Layers, BarChart2, Activity, Zap, Droplet, Square, Cloud, Plane, TrendingUp } from 'lucide-react'

const ICON_MAP = {
    Layers,
    BarChart2,
    Activity,
    Zap,
    Droplet,
    Square,
    Cloud,
    Plane,
    TrendingUp,
}

function Sidebar({
    exchanges,
    selectedExchange,
    onSelectExchange,
    searchQuery,
    onSearchChange,
    favorites,
    showFavoritesOnly,
    onToggleFavorites
}) {
    return (
        <aside className="w-64 bg-[#1a1d29] border-r border-[#252836] flex flex-col">
            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search pair..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-[#252836] text-white text-sm pl-10 pr-4 py-2.5 rounded-lg border border-[#3a3f4b] placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Favorites Section */}
            <div className="px-4 py-2">
                <button
                    onClick={onToggleFavorites}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${showFavoritesOnly
                            ? 'bg-blue-600/20 border border-blue-600/50 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-[#252836]'
                        }`}
                >
                    <Star className={`w-5 h-5 ${showFavoritesOnly ? 'text-yellow-500 fill-yellow-500' : 'text-yellow-500'}`} />
                    <span className="text-sm font-medium">Favorites</span>
                    {favorites.length > 0 && (
                        <span className="ml-auto bg-[#252836] text-gray-400 text-xs px-2 py-0.5 rounded-full">
                            {favorites.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Exchanges Section */}
            <div className="flex-1 px-4 py-2 overflow-y-auto">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
                    Exchanges
                </h3>
                <div className="space-y-1">
                    {exchanges.map((exchange) => {
                        const IconComponent = ICON_MAP[exchange.icon] || Layers
                        const isSelected = selectedExchange === exchange.id

                        return (
                            <button
                                key={exchange.id}
                                onClick={() => onSelectExchange(exchange.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isSelected
                                        ? 'bg-blue-600/20 border-l-2 border-blue-500 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-[#252836] border-l-2 border-transparent'
                                    }`}
                            >
                                <IconComponent className="w-5 h-5" />
                                <span className="text-sm font-medium">{exchange.name}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#252836]">
                <div className="text-xs text-gray-500 text-center">
                    v1.0.0 • Arbitrage Scanner
                </div>
            </div>
        </aside>
    )
}

export default Sidebar
