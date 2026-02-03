import React from 'react';
import Sidebar from './Sidebar';
import DashboardHeader from '../dashboard/DashboardHeader';

export default function MainLayout({
    children,
    enabledExchanges,
    setEnabledExchanges,
    isLoading,
    activeTab,
    setActiveTab,
    refreshInterval,
    setRefreshInterval,
    refresh,
    onAddPosition,
    monitoredCount,
    onOpenAlarms,
    error
}) {
    return (
        <div className="flex h-screen bg-[#0f1117] text-white font-sans selection:bg-blue-500/30 overflow-hidden">
            {/* Sidebar - Fixed Left */}
            <Sidebar
                enabledExchanges={enabledExchanges}
                setEnabledExchanges={setEnabledExchanges}
                isLoading={isLoading}
            />

            {/* Main Content - Scrollable Right */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="overflow-y-auto custom-scrollbar flex-1 h-full">
                    <DashboardHeader
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        refreshInterval={refreshInterval}
                        setRefreshInterval={setRefreshInterval}
                        refresh={refresh}
                        isLoading={isLoading}
                        onAddPosition={onAddPosition}
                        monitoredCount={monitoredCount}
                        onOpenAlarms={onOpenAlarms}
                    />

                    <div className="max-w-[1600px] mx-auto px-6 pb-20">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-2xl mb-8 text-center backdrop-blur-sm">
                                <p className="font-bold text-lg mb-2">Connection Error</p>
                                <p className="opacity-80">{error}</p>
                            </div>
                        )}

                        {children}
                    </div>
                </div>
            </div>

        </div>
    );
}
