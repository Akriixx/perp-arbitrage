import { motion } from "framer-motion";
import { Zap, Activity, Settings, Menu, ChevronDown, RotateCw } from "lucide-react";
import { Badge } from "../ui/Badge";
import { cn } from "../../utils/cn";

const INTERVAL_OPTIONS = [
    { value: 3000, label: '3s' },
    { value: 5000, label: '5s' },
    { value: 15000, label: '15s' },
    { value: 30000, label: '30s' },
    { value: 0, label: 'Manual' },
];

export default function Header({ lastUpdated, isConnected, onRefresh, onHardRefresh, isRefreshing, refreshInterval, onIntervalChange }) {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 glass z-50 px-6 flex items-center justify-between">
            {/* ... Logo ... */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-primary blur-md opacity-50 rounded-full" />
                    <div className="relative bg-brand-primary/10 p-2 rounded-xl border border-brand-primary/20">
                        <Zap className="w-5 h-5 text-brand-primary fill-brand-primary" />
                    </div>
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                    <span className="text-white">Vertex</span>
                    <span className="text-brand-primary">Scan</span>
                </h1>
                <Badge variant="brand" className="ml-2 hidden sm:flex">v1.2</Badge>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
                {/* Interval Selector */}
                <div className="hidden md:flex items-center relative group z-50">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-text-secondary group-hover:text-white transition-colors">
                        <ChevronDown className="w-3 h-3" />
                    </div>
                    <select
                        value={refreshInterval}
                        onChange={(e) => onIntervalChange(Number(e.target.value))}
                        className="appearance-none bg-app-card border border-app-border text-xs font-bold text-text-secondary py-1.5 pl-3 pr-8 rounded-lg outline-none focus:border-brand-primary focus:text-white cursor-pointer hover:bg-white/5 transition-all text-right"
                    >
                        {INTERVAL_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Connection Status */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-app-card border border-app-border text-xs font-medium">
                    <span className="relative flex h-2 w-2">
                        <span className={cn(
                            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                            isConnected ? "bg-profit-green" : "bg-loss-red"
                        )} />
                        <span className={cn(
                            "relative inline-flex rounded-full h-2 w-2",
                            isConnected ? "bg-profit-green" : "bg-loss-red"
                        )} />
                    </span>
                    <span className="text-text-secondary w-20">
                        {lastUpdated ? lastUpdated.toLocaleTimeString() : '--:--:--'}
                    </span>
                </div>

                {/* Hard Refresh Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onHardRefresh}
                    disabled={isRefreshing}
                    title="Force Hard Refresh"
                    className={cn(
                        "p-2 rounded-lg bg-white/5 text-text-secondary border border-app-border hover:bg-white/10 hover:text-white transition-all",
                        isRefreshing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <RotateCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
                </motion.button>
            </div>
        </header>
    );
}
