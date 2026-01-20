import { Star, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

function MarketTable({
    pairs,
    favorites,
    onToggleFavorite,
    sortField,
    sortDirection,
    onSort
}) {
    const formatPrice = (price) => {
        if (!price || price === 0) return '-'
        if (price < 0.01) return price.toPrecision(4)
        if (price < 1) return price.toFixed(4)
        if (price < 100) return price.toFixed(3)
        return price.toFixed(2)
    }

    const getSpreadColor = (spread) => {
        if (spread >= 0.3) return 'text-green-500'
        if (spread >= 0.1) return 'text-yellow-500'
        if (spread >= 0) return 'text-gray-400'
        return 'text-red-500'
    }

    const getSpreadBg = (spread) => {
        if (spread >= 0.3) return 'bg-green-500/10'
        if (spread >= 0.1) return 'bg-yellow-500/10'
        return 'bg-transparent'
    }

    const SortIcon = ({ field }) => {
        if (sortField !== field) {
            return <ArrowUpDown className="w-4 h-4 text-gray-500" />
        }
        return sortDirection === 'desc'
            ? <ArrowDown className="w-4 h-4 text-blue-500" />
            : <ArrowUp className="w-4 h-4 text-blue-500" />
    }

    if (pairs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p className="text-lg mb-4">No pairs found matching your filters</p>
                <p className="text-sm">Try adjusting your search or exchange filter</p>
            </div>
        )
    }

    return (
        <div className="bg-[#1a1d29] rounded-xl border border-[#252836] overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-[#252836]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                            {/* Star column */}
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Pair
                        </th>
                        <th
                            className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                            onClick={() => onSort('realSpread')}
                        >
                            <div className="flex items-center gap-1">
                                Spread
                                <SortIcon field="realSpread" />
                            </div>
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Strategy
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Lighter
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Paradex
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Vest
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {pairs.map((pair) => {
                        const isFavorite = favorites.includes(pair.symbol)
                        const spread = pair.realSpread ?? -999
                        const hasStrategy = pair.bestBidEx && pair.bestAskEx && pair.bestBidEx !== pair.bestAskEx

                        return (
                            <tr
                                key={pair.symbol}
                                className="border-b border-[#252836] hover:bg-[#252836]/50 transition-colors"
                            >
                                {/* Favorite Star */}
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => onToggleFavorite(pair.symbol)}
                                        className="p-1 hover:bg-[#252836] rounded transition-colors"
                                    >
                                        <Star
                                            className={`w-4 h-4 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600 hover:text-gray-400'}`}
                                        />
                                    </button>
                                </td>

                                {/* Pair Symbol */}
                                <td className="px-4 py-3">
                                    <span className="text-white font-semibold">{pair.symbol}</span>
                                </td>

                                {/* Spread */}
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2 py-1 rounded ${getSpreadBg(spread)} ${getSpreadColor(spread)} font-medium text-sm`}>
                                        {spread > -900 ? `${spread.toFixed(3)}%` : '-'}
                                    </span>
                                </td>

                                {/* Strategy */}
                                <td className="px-4 py-3">
                                    {hasStrategy ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex items-center px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-bold uppercase rounded">
                                                LONG {pair.bestAskEx}
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-bold uppercase rounded">
                                                SHORT {pair.bestBidEx}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600">-</span>
                                    )}
                                </td>

                                {/* Lighter Price */}
                                <td className="px-4 py-3 text-center">
                                    <PriceCell
                                        price={pair.lighter}
                                        isBestBid={pair.bestBidEx === 'LIGHTER'}
                                        isBestAsk={pair.bestAskEx === 'LIGHTER'}
                                        formatPrice={formatPrice}
                                    />
                                </td>

                                {/* Paradex Price */}
                                <td className="px-4 py-3 text-center">
                                    <PriceCell
                                        price={pair.paradex}
                                        isBestBid={pair.bestBidEx === 'PARADEX'}
                                        isBestAsk={pair.bestAskEx === 'PARADEX'}
                                        formatPrice={formatPrice}
                                    />
                                </td>

                                {/* Vest Price */}
                                <td className="px-4 py-3 text-center">
                                    <PriceCell
                                        price={pair.vest}
                                        isBestBid={pair.bestBidEx === 'VEST'}
                                        isBestAsk={pair.bestAskEx === 'VEST'}
                                        formatPrice={formatPrice}
                                    />
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

// Price Cell Component
function PriceCell({ price, isBestBid, isBestAsk, formatPrice }) {
    if (!price || (price.bid === 0 && price.ask === 0)) {
        return <span className="text-gray-600">-</span>
    }

    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className={`text-sm font-medium ${isBestBid ? 'text-red-500' : 'text-white'}`}>
                {formatPrice(price.bid)}
            </span>
            <span className={`text-xs ${isBestAsk ? 'text-green-500' : 'text-gray-500'}`}>
                {formatPrice(price.ask)}
            </span>
        </div>
    )
}

export default MarketTable
