import { useState, useEffect } from 'react';

// Sources
const SOURCE_1_SPOTHQ = "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/";
const SOURCE_2_LLAMA = "https://icons.llamao.fi/icon/";

// Manual mapping for symbols that might differ
const SYMBOL_MAP = {
    '1000PEPE': 'pepe',
    '1000FLOKI': 'floki',
    '1000BONK': 'bonk',
    'kBONK': 'bonk',
    'WBTC': 'wbtc',
    'WETH': 'eth',
    'RESOLV': 'resolv',
    'BERA': 'bera',
    'KAITO': 'kaito'
};

// Symbols that we have local custom logos for (in /public/logos/)
const LOCAL_ICONS = new Set(['RESOLV', 'BERA', 'KAITO']);

export default function CryptoIcon({ symbol, className = "w-12 h-12" }) {
    const [src, setSrc] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const [hasError, setHasError] = useState(false);

    const cleanSymbol = (SYMBOL_MAP[symbol] || symbol).toLowerCase();

    // Decide source based on attempt
    useEffect(() => {
        // Reset if symbol changes
        setHasError(false);
        setAttempt(0);
    }, [symbol]);

    useEffect(() => {
        if (hasError) return;

        if (LOCAL_ICONS.has(symbol) && attempt === 0) {
            // Priority 0: Local Custom Icons
            setSrc(`/logos/${cleanSymbol}.png`);
        } else if ((LOCAL_ICONS.has(symbol) ? attempt === 1 : attempt === 0)) {
            // Priority 1: SpotHQ (standard)
            setSrc(`${SOURCE_1_SPOTHQ}${cleanSymbol}.png`);
        } else if ((LOCAL_ICONS.has(symbol) ? attempt === 2 : attempt === 1)) {
            // Priority 2: DefiLlama (new tokens)
            setSrc(`${SOURCE_2_LLAMA}${symbol}`);
        } else {
            setHasError(true);
        }
    }, [attempt, symbol, cleanSymbol, hasError]);

    const handleError = () => {
        // Increment attempt based on whether we started with local or not
        const maxAttempts = LOCAL_ICONS.has(symbol) ? 3 : 2;
        if (attempt < maxAttempts) {
            setAttempt(prev => prev + 1);
        } else {
            setHasError(true);
        }
    };

    // Helper to get gradient for fallback (and MYX since we didn't get a logo for it yet?)
    const getGradient = (sym) => {
        switch (sym) {
            case 'BTC': return 'from-orange-400 to-orange-600';
            case 'ETH': return 'from-indigo-400 to-indigo-600';
            case 'SOL': return 'from-purple-500 to-emerald-400';
            case 'PAXG': return 'from-yellow-400 to-yellow-600';
            case 'HYPE': return 'from-green-400 to-teal-500';
            case 'BERA': return 'from-orange-800 to-orange-500';
            case 'RESOLV': return 'from-blue-400 to-blue-200';
            case 'KAITO': return 'from-purple-600 to-blue-500';
            default: return 'from-pink-500 to-rose-500';
        }
    };

    if (hasError) {
        // Fallback to Gradient Circle
        const gradient = getGradient(symbol);
        return (
            <div className={`${className} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-[0.6rem] sm:text-xs tracking-wider">
                    {symbol?.substring(0, 3)}
                </span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={symbol}
            className={`${className} rounded-full shadow-lg bg-[#1a1a1a] p-0.5 object-contain`}
            onError={handleError}
        />
    );
}
