/**
 * Tests for AppleScript validator
 */

import { describe, it, expect } from 'vitest';
import { validateScript, sanitizeForAppleScript } from '../../../src/executor/validator.js';
import { SecurityError } from '../../../src/shared/errors.js';

describe('Script Validator', () => {
  describe('validateScript', () => {
    it('should pass validation for valid Reminders script', () => {
      const script = `
tell application "Reminders"
    set targetList to list "Work"
    set newReminder to make new reminder at end of targetList
    set name of newReminder to "Test"
end tell
      `;

      expect(() => validateScript(script, 'Reminders')).not.toThrow();
    });

    it('should reject empty script', () => {
      expect(() => validateScript('', 'Reminders')).toThrow(SecurityError);
      expect(() => validateScript('   ', 'Reminders')).toThrow(SecurityError);
    });

    it('should reject excessively long script', () => {
      const longScript = 'tell application "Reminders"\n' + 'a'.repeat(60000) + '\nend tell';

      expect(() => validateScript(longScript, 'Reminders')).toThrow(SecurityError);
    });

    it('should reject script targeting non-whitelisted app', () => {
      const script = 'tell application "System Events"';

      expect(() => validateScript(script, 'System Events')).toThrow(SecurityError);
      expect(() => validateScript(script, 'SystemPreferences')).toThrow(SecurityError);
    });

    it('should reject script with shell execution', () => {
      const maliciousScript = `
tell application "Reminders"
    do shell script "rm -rf /"
end tell
      `;

      expect(() => validateScript(maliciousScript, 'Reminders')).toThrow(SecurityError);
    });

    it('should reject script with sudo', () => {
      const maliciousScript = `
tell application "Reminders"
    do shell script "sudo something" with administrator privileges
end tell
      `;

      expect(() => validateScript(maliciousScript, 'Reminders')).toThrow(SecurityError);
    });

    it('should reject script with keystroke injection', () => {
      const maliciousScript = `
tell application "System Events"
    keystroke "password"
end tell
      `;

      expect(() => validateScript(maliciousScript, 'System Events')).toThrow(SecurityError);
    });

    it('should reject script not starting with tell application', () => {
      const script = 'set x to 5';

      expect(() => validateScript(script, 'Reminders')).toThrow(SecurityError);
    });

    it('should reject script not targeting declared app', () => {
      const script = `
tell application "Calendar"
    -- do something
end tell
      `;

      expect(() => validateScript(script, 'Reminders')).toThrow(SecurityError);
    });

    it('should pass for Calendar app script', () => {
      const script = `
tell application "Calendar"
    set targetCalendar to calendar "Work"
end tell
      `;

      expect(() => validateScript(script, 'Calendar')).not.toThrow();
    });

    it('should pass for Notes app script', () => {
      const script = `
tell application "Notes"
    set targetFolder to folder "Notes"
end tell
      `;

      expect(() => validateScript(script, 'Notes')).not.toThrow();
    });
  });

  describe('sanitizeForAppleScript', () => {
    it('should escape double quotes', () => {
      const input = 'Task with "quotes"';
      const expected = 'Task with \\"quotes\\"';

      expect(sanitizeForAppleScript(input)).toBe(expected);
    });

    it('should escape backslashes', () => {
      const input = 'Path\\to\\file';
      const expected = 'Path\\\\to\\\\file';

      expect(sanitizeForAppleScript(input)).toBe(expected);
    });

    it('should escape newlines', () => {
      const input = 'Line 1\nLine 2';
      const expected = 'Line 1\\nLine 2';

      expect(sanitizeForAppleScript(input)).toBe(expected);
    });

    it('should handle combined escaping', () => {
      const input = 'Text with "quotes" and \\ backslash\nand newline';
      const expected = 'Text with \\"quotes\\" and \\\\ backslash\\nand newline';

      expect(sanitizeForAppleScript(input)).toBe(expected);
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeForAppleScript('')).toBe('');
    });
  });
});
