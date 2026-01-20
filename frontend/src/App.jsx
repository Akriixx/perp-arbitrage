/**
 * Perp Arbitrage Dashboard
 * Main Application Component
 */

import { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MarketTable from './components/dashboard/MarketTable';
import { useMarketData } from './hooks/useMarketData';
import { useFavorites } from './hooks/useFavorites';
import { useFilters } from './hooks/useFilters';
import { EXCHANGES, REFRESH_INTERVALS } from './utils/constants';
import './index.css';

function App() {
  // Refresh interval state
  const [refreshInterval, setRefreshInterval] = useState(30000);

  // Custom hooks
  const { pairs, isLoading, isConnected, lastUpdate, refresh } = useMarketData(refreshInterval);
  const { favorites, showFavoritesOnly, toggleFavorite, toggleShowFavorites, favoritesCount } = useFavorites();
  const {
    searchQuery,
    setSearchQuery,
    selectedExchange,
    setSelectedExchange,
    sortField,
    sortDirection,
    handleSort,
    clearFilters,
    filteredPairs
  } = useFilters(pairs, favorites, showFavoritesOnly);

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
        onToggleFavorites={toggleShowFavorites}
        favoritesCount={favoritesCount}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          refreshIntervals={REFRESH_INTERVALS}
          currentInterval={refreshInterval}
          onIntervalChange={setRefreshInterval}
          lastUpdate={lastUpdate}
          onRefresh={refresh}
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
  );
}

export default App;
