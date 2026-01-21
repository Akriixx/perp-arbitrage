/**
 * Formatters Tests
 * Tests for price and spread formatting functions
 */

import { describe, test, expect } from 'vitest';
import { formatPrice, formatSpread, getSpreadColor, getSpreadBg } from '../../src/utils/formatters';

describe('formatPrice', () => {
    test('should return dash for null/undefined', () => {
        expect(formatPrice(null)).toBe('-');
        expect(formatPrice(undefined)).toBe('-');
        expect(formatPrice(0)).toBe('-');
    });

    test('should format very small prices (< 0.01) with precision', () => {
        expect(formatPrice(0.00001234)).toMatch(/0\.0000123/);
        expect(formatPrice(0.0001)).toMatch(/0\.0001/);
    });

    test('should format small prices (< 1) with 4 decimals', () => {
        expect(formatPrice(0.1234)).toBe('0.1234');
        expect(formatPrice(0.5)).toBe('0.5000');
    });

    test('should format medium prices (< 100) with 3 decimals', () => {
        expect(formatPrice(12.345)).toBe('12.345');
        expect(formatPrice(99.999)).toBe('99.999');
    });

    test('should format large prices (>= 100) with 2 decimals', () => {
        expect(formatPrice(100)).toBe('100.00');
        expect(formatPrice(50000.789)).toBe('50000.79');
    });
});

describe('formatSpread', () => {
    test('should return dash for invalid spreads', () => {
        expect(formatSpread(null)).toBe('-');
        expect(formatSpread(undefined)).toBe('-');
        expect(formatSpread(-999)).toBe('-');
    });

    test('should format positive spread with %', () => {
        expect(formatSpread(0.5)).toBe('0.500%');
        expect(formatSpread(1.234)).toBe('1.234%');
    });

    test('should format negative spread with %', () => {
        expect(formatSpread(-0.5)).toBe('-0.500%');
    });
});

describe('getSpreadColor', () => {
    test('should return green for high spread (>= 0.3)', () => {
        expect(getSpreadColor(0.3)).toBe('text-green-500');
        expect(getSpreadColor(1.0)).toBe('text-green-500');
    });

    test('should return yellow for medium spread (>= 0.1)', () => {
        expect(getSpreadColor(0.1)).toBe('text-yellow-500');
        expect(getSpreadColor(0.25)).toBe('text-yellow-500');
    });

    test('should return gray for low spread (>= 0)', () => {
        expect(getSpreadColor(0)).toBe('text-gray-400');
        expect(getSpreadColor(0.05)).toBe('text-gray-400');
    });

    test('should return red for negative spread', () => {
        expect(getSpreadColor(-0.1)).toBe('text-red-500');
    });
});

describe('getSpreadBg', () => {
    test('should return green bg for high spread', () => {
        expect(getSpreadBg(0.5)).toBe('bg-green-500/10');
    });

    test('should return yellow bg for medium spread', () => {
        expect(getSpreadBg(0.2)).toBe('bg-yellow-500/10');
    });

    test('should return transparent for low/negative spread', () => {
        expect(getSpreadBg(0)).toBe('bg-transparent');
        expect(getSpreadBg(-1)).toBe('bg-transparent');
    });
});
