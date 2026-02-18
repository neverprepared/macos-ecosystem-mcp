/**
 * Tests for shared utilities
 */

import { describe, it, expect } from 'vitest';
import {
  escapeAppleScriptString,
  formatAppleScriptDate,
  parseISODate,
  truncate,
  priorityToAppleScript,
  appleScriptToPriority,
  isNonEmptyString,
  safeJsonParse,
} from '../../../src/shared/utils.js';

describe('Shared Utilities', () => {
  describe('escapeAppleScriptString', () => {
    it('should escape double quotes', () => {
      expect(escapeAppleScriptString('Test "quotes"')).toBe('Test \\"quotes\\"');
    });

    it('should escape backslashes', () => {
      expect(escapeAppleScriptString('Path\\to\\file')).toBe('Path\\\\to\\\\file');
    });

    it('should handle empty string', () => {
      expect(escapeAppleScriptString('')).toBe('');
    });
  });

  describe('formatAppleScriptDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2026-02-18T14:30:00Z');
      const formatted = formatAppleScriptDate(date);

      // Format should be like "Wednesday, February 18, 2026 at 2:30:00 PM"
      expect(formatted).toContain('February');
      expect(formatted).toContain('18');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('at');
    });
  });

  describe('parseISODate', () => {
    it('should parse valid ISO date', () => {
      const isoString = '2026-02-18T14:30:00Z';
      const date = parseISODate(isoString);

      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toBe('2026-02-18T14:30:00.000Z');
    });

    it('should throw on invalid date', () => {
      expect(() => parseISODate('not-a-date')).toThrow('Invalid date string');
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      const input = 'Short text';
      expect(truncate(input, 100)).toBe(input);
    });

    it('should truncate long strings', () => {
      const input = 'a'.repeat(100);
      const result = truncate(input, 50);

      expect(result.length).toBe(50);
      expect(result).toContain('...');
    });

    it('should handle exact length', () => {
      const input = 'a'.repeat(50);
      expect(truncate(input, 50)).toBe(input);
    });
  });

  describe('priorityToAppleScript', () => {
    it('should convert priority correctly', () => {
      expect(priorityToAppleScript('none')).toBe(0);
      expect(priorityToAppleScript('low')).toBe(1);
      expect(priorityToAppleScript('medium')).toBe(5);
      expect(priorityToAppleScript('high')).toBe(9);
    });
  });

  describe('appleScriptToPriority', () => {
    it('should convert value to priority', () => {
      expect(appleScriptToPriority(0)).toBe('none');
      expect(appleScriptToPriority(1)).toBe('low');
      expect(appleScriptToPriority(5)).toBe('medium');
      expect(appleScriptToPriority(9)).toBe('high');
    });

    it('should handle edge cases', () => {
      expect(appleScriptToPriority(4)).toBe('low');
      expect(appleScriptToPriority(7)).toBe('medium');
      expect(appleScriptToPriority(10)).toBe('high');
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  text  ')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"key":"value"}', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('should return fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = safeJsonParse('not json', fallback);
      expect(result).toBe(fallback);
    });

    it('should return fallback for empty string', () => {
      const fallback = { default: true };
      const result = safeJsonParse('', fallback);
      expect(result).toBe(fallback);
    });
  });
});
