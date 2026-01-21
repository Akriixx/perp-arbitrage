import { motion } from "framer-motion";
import { LayoutDashboard, Star, Filter, TrendingUp } from "lucide-react";
import { cn } from "../../utils/cn";

const NAV_ITEMS = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'favorites', icon: Star, label: 'Favorites' },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
];

export default function Sidebar({ activeTab, onTabChange }) {
    return (
        <aside className="fixed left-0 top-16 bottom-0 w-64 glass border-r border-app-border hidden md:flex flex-col py-6 px-4 z-40">
            <nav className="space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "text-white"
                                    : "text-text-secondary hover:text-white hover:bg-app-card-hover"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-brand-primary/10 border-l-2 border-brand-primary"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            <Icon className={cn(
                                "w-5 h-5 transition-colors relative z-10",
                                isActive ? "text-brand-primary" : "group-hover:text-brand-primary"
                            )} />
                            <span className="font-medium relative z-10">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="mt-auto">
                <div className="p-4 rounded-xl bg-gradient-to-br from-brand-secondary/10 to-brand-primary/5 border border-white/5">
                    <h4 className="text-sm font-bold text-white mb-1">Pro Status</h4>
                    <p className="text-xs text-text-muted mb-3">Live data connection active</p>
                    <div className="h-1.5 w-full bg-app-dark rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary w-full animate-pulse-glow" />
                    </div>
                </div>
            </div>
        </aside>
    );
}
