import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Target } from 'lucide-react';
import DetailView from './components/dashboard/DetailView';
import DashboardHeader from './components/dashboard/DashboardHeader';
import OpportunityCard from './components/dashboard/OpportunityCard';
import PositionsTab from './components/positions/PositionsTab';
import AddPositionModal from './components/positions/AddPositionModal';
import ExitAlarmModal from './components/positions/ExitAlarmModal';
import ScannerAlarmModal from './components/dashboard/ScannerAlarmModal';
import TrackRecordTab from './components/track/TrackRecordTab';
import useMarketData from './hooks/useMarketData';
import { useAlerts } from './hooks/useAlerts';

// Sound URLs
const ALERT_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/933/933-preview.mp3";
const EXIT_ALARM_URL = "https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3"; // Different sound for exit

function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [selectedPair, setSelectedPair] = useState(null);
  const [settingsOpenFor, setSettingsOpenFor] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [activeScannerAlarm, setActiveScannerAlarm] = useState(null);
  const [acknowledgedScannerAlarms, setAcknowledgedScannerAlarms] = useState(new Set());
  const [isFocusMode, setIsFocusMode] = useState(() => {
    try {
      const saved = localStorage.getItem('is_focus_mode');
      return saved ? JSON.parse(saved) : false;
    } catch (e) { return false; }
  });

  const [enabledExchanges, setEnabledExchanges] = useState(() => {
    try {
      const saved = localStorage.getItem('enabled_exchanges');
      return saved ? JSON.parse(saved) : { vest: true, lighter: true, paradex: true };
    } catch (e) { return { vest: true, lighter: true, paradex: true }; }
  });

  const [pairThresholds, setPairThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem('pair_thresholds');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [trades, setTrades] = useState(() => {
    try {
      const saved = localStorage.getItem('track_trades');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [initialInvestment, setInitialInvestment] = useState(() => {
    try {
      const saved = localStorage.getItem('initial_investment');
      return saved ? parseFloat(saved) : 1000;
    } catch (e) { return 1000; }
  });

  const [positions, setPositions] = useState(() => {
    try {
      const saved = localStorage.getItem('active_positions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const { pairs, isLoading, error, refresh, refreshInterval, setRefreshInterval } = useMarketData();
  const { minSpread, soundEnabled } = useAlerts();

  // Helper functions (moved up)
  const isMonitored = useCallback((symbol) => pairThresholds.hasOwnProperty(symbol), [pairThresholds]);
  const getAlertThreshold = useCallback((symbol) => pairThresholds[symbol] !== undefined ? pairThresholds[symbol] : minSpread, [pairThresholds, minSpread]);

  // Effects
  useEffect(() => {
    localStorage.setItem('is_focus_mode', JSON.stringify(isFocusMode));
    if (isFocusMode && selectedPair && !isMonitored(selectedPair.symbol)) {
      setSelectedPair(null);
    }
  }, [isFocusMode, selectedPair, isMonitored]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key.toLowerCase() === 'f') setIsFocusMode(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => { localStorage.setItem('active_positions', JSON.stringify(positions)); }, [positions]);
  useEffect(() => { localStorage.setItem('track_trades', JSON.stringify(trades)); }, [trades]);
  useEffect(() => { localStorage.setItem('initial_investment', initialInvestment.toString()); }, [initialInvestment]);
  useEffect(() => { localStorage.setItem('enabled_exchanges', JSON.stringify(enabledExchanges)); }, [enabledExchanges]);
  useEffect(() => { localStorage.setItem('pair_thresholds', JSON.stringify(pairThresholds)); }, [pairThresholds]);

  const getDynamicSpread = useCallback((pair) => {
    let maxBid = 0, maxBidEx = null;
    let minAsk = Infinity, minAskEx = null;

    ['vest', 'lighter', 'paradex'].forEach(ex => {
      if (!enabledExchanges[ex]) return;
      const bid = pair[ex]?.bid || 0;
      const ask = pair[ex]?.ask || 0;
      if (bid > maxBid) { maxBid = bid; maxBidEx = ex.toUpperCase(); }
      if (ask > 0 && ask < minAsk) { minAsk = ask; minAskEx = ex.toUpperCase(); }
    });

    if (maxBid > 0 && minAsk !== Infinity) {
      return { realSpread: ((maxBid - minAsk) / minAsk) * 100, bestBid: maxBid, bestAsk: minAsk, bestBidEx: maxBidEx, bestAskEx: minAskEx };
    }
    return { realSpread: -999, bestBid: 0, bestAsk: 0, bestBidEx: null, bestAskEx: null };
  }, [enabledExchanges]);

  // Memoized derived data
  const dynamicPairs = useMemo(() => pairs.map(p => ({ ...p, ...getDynamicSpread(p) })), [pairs, getDynamicSpread]);
  const monitoredCount = useMemo(() => dynamicPairs.filter(p => isMonitored(p.symbol)).length, [dynamicPairs, isMonitored]);

  const sortedData = useMemo(() => {
    const data = isFocusMode ? dynamicPairs.filter(p => isMonitored(p.symbol)) : dynamicPairs;
    return [...data].sort((a, b) => {
      const aThreshold = getAlertThreshold(a.symbol);
      const bThreshold = getAlertThreshold(b.symbol);
      const aAlerting = isMonitored(a.symbol) && a.realSpread >= aThreshold;
      const bAlerting = isMonitored(b.symbol) && b.realSpread >= bThreshold;
      if (aAlerting && !bAlerting) return -1;
      if (!aAlerting && bAlerting) return 1;
      return (b.realSpread || -999) - (a.realSpread || -999);
    });
  }, [dynamicPairs, isFocusMode, isMonitored, getAlertThreshold]);

  // Alert Sounds
  const playSound = (url) => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio(url);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn("Audio play failed", e));
    } catch (e) { }
  };

  // Main Alert Detection Effect
  useEffect(() => {
    if (!dynamicPairs || dynamicPairs.length === 0) return;

    // 1. Scanner Alarms (Detect new ones)
    if (!activeScannerAlarm) {
      for (const pair of dynamicPairs) {
        const spread = pair.realSpread || 0;
        const threshold = pairThresholds[pair.symbol] !== undefined ? pairThresholds[pair.symbol] : minSpread;
        const isCustom = pairThresholds.hasOwnProperty(pair.symbol);

        // Only trigger if custom threshold is set (per user's previous preference)
        if (isCustom && spread >= threshold && !acknowledgedScannerAlarms.has(pair.symbol)) {
          setActiveScannerAlarm(pair);
          break;
        }

        // Auto-reset acknowledgment if spread falls below threshold
        if (acknowledgedScannerAlarms.has(pair.symbol) && spread < threshold) {
          setAcknowledgedScannerAlarms(prev => {
            const next = new Set(prev);
            next.delete(pair.symbol);
            return next;
          });
        }
      }
    }

    // 2. Position Convergence Alarms
    if (!activeAlarm) {
      for (const pos of positions) {
        const livePair = dynamicPairs.find(p => p.symbol === pos.symbol);
        if (livePair && livePair.realSpread !== -999 && livePair.realSpread <= pos.exitTargetSpread) {
          if (!pos.lastAlarmTriggered || pos.lastAlarmTriggered !== pos.exitTargetSpread) {
            setActiveAlarm(pos);
            updatePosition(pos.id, { lastAlarmTriggered: pos.exitTargetSpread });
            break;
          }
        }
      }
    }
  }, [dynamicPairs, pairThresholds, minSpread, positions, activeAlarm, activeScannerAlarm, acknowledgedScannerAlarms]);

  // Repeating alarm sound for Scanner
  useEffect(() => {
    if (!activeScannerAlarm || !soundEnabled) return;

    playSound(ALERT_SOUND_URL);
    const soundInterval = setInterval(() => {
      playSound(ALERT_SOUND_URL);
    }, 10000);

    return () => clearInterval(soundInterval);
  }, [activeScannerAlarm?.symbol, soundEnabled]);



  const updateThreshold = (symbol, newValue) => {
    setPairThresholds(prev => {
      const next = { ...prev };
      if (newValue === null || newValue === '') delete next[symbol];
      else next[symbol] = parseFloat(newValue);
      return next;
    });
    setSettingsOpenFor(null);
  };

  const addPosition = (pos) => setPositions(prev => [...prev, pos]);
  const removePosition = (id) => setPositions(prev => prev.filter(p => p.id !== id));
  const updatePosition = (id, updates) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Repeating alarm sound for Position Exit
  useEffect(() => {
    if (!activeAlarm || !soundEnabled) return;

    playSound(EXIT_ALARM_URL);
    const soundInterval = setInterval(() => {
      playSound(EXIT_ALARM_URL);
    }, 10000);

    return () => clearInterval(soundInterval);
  }, [activeAlarm?.id, soundEnabled]);

  const addTrade = (trade) => setTrades(prev => [trade, ...prev]);
  const removeTrade = (id) => setTrades(prev => prev.filter(t => t.id !== id));
  const updateInvestment = (value) => setInitialInvestment(parseFloat(value) || 0);

  const stopAlarm = () => setActiveAlarm(null);
  const stopScannerAlarm = () => {
    if (activeScannerAlarm) {
      setAcknowledgedScannerAlarms(prev => {
        const next = new Set(prev);
        next.add(activeScannerAlarm.symbol);
        return next;
      });
      setActiveScannerAlarm(null);
    }
  };



  const renderContent = () => {
    if (activeTab === 'scanner') {
      return (
        <>
          {!isLoading && isFocusMode && monitoredCount === 0 && (
            <div className="text-center py-20 bg-[#1a1d24] border border-dashed border-gray-800 rounded-3xl animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">No monitored pairs yet</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Click <span className="text-gray-300">⚙️</span> on any pair to set a custom alert threshold and focus on what matters.</p>
              <button
                onClick={() => setIsFocusMode(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20"
              >
                Disable Focus Mode
              </button>
            </div>
          )}

          {!isLoading && sortedData.length === 0 && !isFocusMode && !error && (
            <div className="text-center py-32 opacity-50">
              <p className="text-2xl font-light">No opportunities found.</p>
            </div>
          )}

          {isFocusMode && monitoredCount > 0 && (
            <div className="flex items-center gap-3 mb-6 bg-blue-500/10 border border-blue-500/20 p-3 rounded-2xl animate-in slide-in-from-top-2 duration-300">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Target className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-bold text-blue-100 uppercase tracking-tight">
                Focus Mode: <span className="text-blue-400">Showing {monitoredCount} monitored pairs</span>
              </p>
              <button
                onClick={() => setIsFocusMode(false)}
                className="ml-auto p-1.5 hover:bg-white/10 rounded-lg transition-all text-blue-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className={isFocusMode
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          }>
            <AnimatePresence mode="popLayout">
              {sortedData.map((row, i) => (
                <OpportunityCard
                  key={row.symbol || i}
                  row={row}
                  index={i}
                  onSelect={setSelectedPair}
                  settingsOpenFor={settingsOpenFor}
                  setSettingsOpenFor={setSettingsOpenFor}
                  getAlertThreshold={getAlertThreshold}
                  hasCustomThreshold={pairThresholds.hasOwnProperty(row.symbol)}
                  updateThreshold={updateThreshold}
                  minSpread={minSpread}
                  isFocusMode={isFocusMode}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      );
    } else if (activeTab === 'positions') {
      return (
        <PositionsTab
          positions={positions}
          pairs={dynamicPairs}
          onRemove={removePosition}
          onUpdate={updatePosition}
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
    <div className="min-h-screen bg-[#0f1117] text-white font-sans selection:bg-blue-500/30">
      <DashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        enabledExchanges={enabledExchanges}
        setEnabledExchanges={setEnabledExchanges}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        refresh={refresh}
        isLoading={isLoading}
        onAddPosition={() => setIsAddModalOpen(true)}
        isFocusMode={isFocusMode}
        setIsFocusMode={setIsFocusMode}
        monitoredCount={monitoredCount}
      />

      <div className="max-w-[1400px] mx-auto px-6 pb-20">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-2xl mb-8 text-center backdrop-blur-sm">
            <p className="font-bold text-lg mb-2">Connection Error</p>
            <p className="opacity-80">{error}</p>
          </div>
        )}

        {renderContent()}

      </div>

      <AddPositionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addPosition}
        symbols={['BTC', 'ETH', 'SOL', 'PAXG', 'RESOLV', 'BERA', 'KAITO']}
      />

      <AnimatePresence>
        {selectedPair && (
          <DetailView pair={selectedPair.symbol} data={selectedPair} onClose={() => setSelectedPair(null)} />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-pulse-slow { animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: .75; } }
      `}</style>
      <ExitAlarmModal
        position={activeAlarm}
        onConfirm={stopAlarm}
      />
      <ScannerAlarmModal
        pair={activeScannerAlarm}
        onConfirm={stopScannerAlarm}
      />
    </div>
  );
}

export default App;

