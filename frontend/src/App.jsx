import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MarketTable from './components/MarketTable'
import './index.css'

const EXCHANGES = [
  { id: 'all', name: 'All Exchanges', icon: 'Layers' },
  { id: 'paradex', name: 'Paradex', icon: 'BarChart2' },
  { id: 'vest', name: 'Vest', icon: 'Activity' },
  { id: 'lighter', name: 'Lighter', icon: 'Zap' },
]

const REFRESH_INTERVALS = [
  { value: 10000, label: '10s' },
  { value: 30000, label: '30s' },
  { value: 60000, label: '1min' },
  { value: 300000, label: '5min' },
]

function App() {
  // State
  const [pairs, setPairs] = useState([])
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('arbi_favorites')
    return saved ? JSON.parse(saved) : []
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExchange, setSelectedExchange] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [sortField, setSortField] = useState('realSpread')
  const [sortDirection, setSortDirection] = useState('desc')
  const [refreshInterval, setRefreshInterval] = useState(30000)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/scans')
      const data = await response.json()
      setPairs(data.pairs || [])
      setLastUpdate(new Date())
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch and interval
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchData, refreshInterval])

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('arbi_favorites', JSON.stringify(favorites))
  }, [favorites])

  // Toggle favorite
  const toggleFavorite = useCallback((symbol) => {
    setFavorites(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    )
  }, [])

  // Filter and sort pairs
  const filteredPairs = pairs
    .filter(pair => {
      // Search filter
      if (searchQuery && !pair.symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Favorites filter
      if (showFavoritesOnly && !favorites.includes(pair.symbol)) {
        return false
      }
      // Exchange filter
      if (selectedExchange !== 'all') {
        const exchangeData = pair[selectedExchange]
        if (!exchangeData || (exchangeData.bid === 0 && exchangeData.ask === 0)) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => {
      const aVal = a[sortField] ?? -999
      const bVal = b[sortField] ?? -999
      return sortDirection === 'desc' ? bVal - aVal : aVal - bVal
    })

  // Handle sort
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }, [sortField])

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedExchange('all')
    setShowFavoritesOnly(false)
  }, [])

  return (
    <div className="flex h-screen bg-[#0f1117]">
      {/* Sidebar */}
      <Sidebar
        exchanges={EXCHANGES}
        selectedExchange={selectedExchange}
        onSelectExchange={setSelectedExchange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favorites={favorites}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly(prev => !prev)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          refreshIntervals={REFRESH_INTERVALS}
          currentInterval={refreshInterval}
          onIntervalChange={setRefreshInterval}
          lastUpdate={lastUpdate}
          onRefresh={fetchData}
          isLoading={isLoading}
          isConnected={isConnected}
          onClearFilters={clearFilters}
        />

        {/* Table */}
        <main className="flex-1 overflow-auto p-4">
          <MarketTable
            pairs={filteredPairs}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </main>
      </div>
    </div>
  )
}

export default App
