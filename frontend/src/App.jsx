import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';

// Layout & Views
import MainLayout from './components/layout/MainLayout';
import ScannerView from './views/ScannerView';
import PositionsView from './views/PositionsView';

// Components
import DetailView from './components/dashboard/DetailView';
import AddPositionModal from './components/positions/AddPositionModal';
import ExitAlarmModal from './components/positions/ExitAlarmModal';
import ScannerAlarmModal from './components/dashboard/ScannerAlarmModal';
import ActiveAlarmsModal from './components/dashboard/ActiveAlarmsModal';
import TrackRecordTab from './components/track/TrackRecordTab';

// Hooks
import useMarketData from './hooks/useMarketData';
import { useAlerts } from './hooks/useAlerts';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAppAlarms } from './hooks/useAppAlarms';
import { useArbitrageEngine } from './hooks/useArbitrageEngine';
import { ACTIVE_EXCHANGES_LIST, AVAILABLE_SYMBOLS } from './utils/constants';

function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [selectedPair, setSelectedPair] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isActiveAlarmsModalOpen, setIsActiveAlarmsModalOpen] = useState(false);

  // --- State with Persistence ---
  const defaultExchanges = ACTIVE_EXCHANGES_LIST.reduce((acc, ex) => ({ ...acc, [ex]: true }), {});
  const [storedExchanges, setStoredExchanges] = useLocalStorage('enabled_exchanges', defaultExchanges);

  // Merge stored with default
  const enabledExchanges = { ...defaultExchanges, ...storedExchanges };
  const setEnabledExchanges = setStoredExchanges;

  const [pairThresholds, setPairThresholds] = useLocalStorage('pair_thresholds', {});
  const [disabledAlarms, setDisabledAlarms] = useLocalStorage('disabled_alarms', []);
  const [trades, setTrades] = useLocalStorage('track_trades', []);
  const [initialInvestment, setInitialInvestment] = useLocalStorage('initial_investment', 1000);
  const [positions, setPositions] = useLocalStorage('active_positions', []);
  const [marginPerSide, setMarginPerSide] = useLocalStorage('calc_margin_per_side', 1000);

  const { pairs, isLoading, error, refresh, refreshInterval, setRefreshInterval } = useMarketData();
  const { minSpread, soundEnabled } = useAlerts();

  // --- Core Engine Logic ---
  const {
    dynamicPairs,
    sortedData,
    monitoredCount,
    getAlertThreshold,
    isMonitored
  } = useArbitrageEngine(pairs, enabledExchanges, pairThresholds, minSpread);

  // --- Actions ---
  const addPosition = useCallback((pos) => setPositions(prev => [...prev, pos]), [setPositions]);
  const removePosition = useCallback((id) => setPositions(prev => prev.filter(p => p.id !== id)), [setPositions]);
  const updatePosition = useCallback((id, updates) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setPositions]);

  const addTrade = (trade) => setTrades(prev => [trade, ...prev]);
  const removeTrade = (id) => setTrades(prev => prev.filter(t => t.id !== id));
  const updateInvestment = (value) => setInitialInvestment(parseFloat(value) || 0);

  const updateThreshold = (symbol, newValue) => {
    setPairThresholds(prev => {
      const next = { ...prev };
      if (newValue === null || newValue === '') delete next[symbol];
      else next[symbol] = parseFloat(newValue);
      return next;
    });
  };

  const toggleDisabledAlarm = (symbol) => {
    setDisabledAlarms(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  };

  // --- Alarms Logic ---
  const {
    activeAlarm,
    activeScannerAlarm,
    stopAlarm,
    stopScannerAlarm
  } = useAppAlarms(dynamicPairs, pairThresholds, minSpread, positions, updatePosition, soundEnabled, disabledAlarms);

  // --- Routing / View Selection ---
  const renderContent = () => {
    if (activeTab === 'scanner') {
      return (
        <ScannerView
          sortedData={sortedData}
          isLoading={isLoading}
          error={error}
          marginPerSide={marginPerSide}
          setMarginPerSide={setMarginPerSide}
          pairThresholds={pairThresholds}
          updateThreshold={updateThreshold}
          getAlertThreshold={getAlertThreshold}
          minSpread={minSpread}
          onSelectPair={setSelectedPair}
        />
      );
    } else if (activeTab === 'positions') {
      return (
        <PositionsView
          positions={positions}
          dynamicPairs={dynamicPairs}
          removePosition={removePosition}
          updatePosition={updatePosition}
        />
      );
    } else if (activeTab === 'trackRecord') {
      return (
        <TrackRecordTab
          trades={trades}
          initialInvestment={initialInvestment}
          onAddTrade={addTrade}
          onRemoveTrade={removeTrade}
          onUpdateInvestment={updateInvestment}
        />
      );
    }
  };

  return (
    <>
      <MainLayout
        enabledExchanges={enabledExchanges}
        setEnabledExchanges={setEnabledExchanges}
        isLoading={isLoading}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        refresh={refresh}
        onAddPosition={() => setIsAddModalOpen(true)}
        monitoredCount={monitoredCount}
        onOpenAlarms={() => setIsActiveAlarmsModalOpen(true)}
        error={error}
      >
        {renderContent()}
      </MainLayout>

      {/* Modals & Overlays */}
      <AddPositionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addPosition}
        symbols={AVAILABLE_SYMBOLS}
      />

      <AnimatePresence>
        {selectedPair && (
          <DetailView
            pair={selectedPair.symbol}
            data={dynamicPairs.find(p => p.symbol === selectedPair.symbol) || selectedPair}
            onClose={() => setSelectedPair(null)}
          />
        )}
      </AnimatePresence>

      <ExitAlarmModal
        position={activeAlarm}
        onConfirm={stopAlarm}
      />
      <ScannerAlarmModal
        pair={activeScannerAlarm}
        onConfirm={stopScannerAlarm}
      />
      <ActiveAlarmsModal
        isOpen={isActiveAlarmsModalOpen}
        onClose={() => setIsActiveAlarmsModalOpen(false)}
        pairThresholds={pairThresholds}
        disabledAlarms={disabledAlarms}
        toggleAlarm={toggleDisabledAlarm}
        removeAlarm={(symbol) => updateThreshold(symbol, null)}
      />
    </>
  );
}

export default App;
