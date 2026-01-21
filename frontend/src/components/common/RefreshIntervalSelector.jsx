import { memo } from 'react';

/**
 * Refresh Interval Selector Component
 * Allows users to choose auto-refresh frequency (3s or 5s)
 */
const RefreshIntervalSelector = memo(({ interval, onChange }) => {
    const intervals = [
        { value: 3000, label: '3s' },
        { value: 5000, label: '5s' }
    ];

    return (
        <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm font-medium mr-1">Refresh:</span>
            <div className="flex rounded-lg bg-gray-800/50 p-1 gap-1">
                {intervals.map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => onChange(value)}
                        className={`
              px-3 py-1.5 text-sm font-bold rounded-md transition-all duration-200
              ${interval === value
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }
            `}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
});

RefreshIntervalSelector.displayName = 'RefreshIntervalSelector';

export default RefreshIntervalSelector;
