/**
 * Exchange Services Registry
 * 
 * Centralized exports for all exchange services.
 * To add a new exchange:
 * 1. Create a new service file extending BaseExchangeService
 * 2. Export it here
 * 3. Register it in the EXCHANGE_REGISTRY
 */

export { BaseExchangeService, IExchangeService, MarketData, ExchangeConfig } from './BaseExchangeService';
export { HybridExchangeService, HybridConfig, TimestampedPrice } from './HybridExchangeService';
export { paradexService, ParadexService } from './ParadexService';
export { vestService, VestService } from './VestService';
export { lighterService, LighterService } from './LighterService';
export { vestHybridService, VestHybridService } from './VestHybridService';
export { lighterHybridService, LighterHybridService } from './LighterHybridService';

import { IExchangeService } from './BaseExchangeService';
import { paradexService } from './ParadexService';
import { vestHybridService } from './VestHybridService';
import { lighterHybridService } from './LighterHybridService';

/**
 * Registry of all available exchange services (using hybrid where available)
 * Add new exchanges here for automatic integration
 */
export const EXCHANGE_REGISTRY: Record<string, IExchangeService> = {
    PARADEX: paradexService,
    VEST: vestHybridService,
    LIGHTER: lighterHybridService
};

/**
 * Get all registered exchange services
 */
export function getAllExchanges(): IExchangeService[] {
    return Object.values(EXCHANGE_REGISTRY);
}

/**
 * Get a specific exchange by name
 */
export function getExchange(name: string): IExchangeService | undefined {
    return EXCHANGE_REGISTRY[name.toUpperCase()];
}
