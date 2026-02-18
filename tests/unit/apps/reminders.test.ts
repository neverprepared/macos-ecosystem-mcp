/**
 * Tests for Reminders app script generation
 */

import { describe, it, expect } from 'vitest';
import {
  generateAddReminderScript,
  generateListRemindersScript,
  generateCompleteReminderScript,
  generateSearchRemindersScript,
} from '../../../src/apps/reminders/scripts.js';

describe('Reminders Script Generation', () => {
  describe('generateAddReminderScript', () => {
    it('should generate basic add reminder script', () => {
      const script = generateAddReminderScript({
        title: 'Test Reminder',
        list: 'Work',
        priority: 'high',
        flagged: true,
      });

      expect(script).toContain('tell application "Reminders"');
      expect(script).toContain('list "Work"');
      expect(script).toContain('Test Reminder');
      expect(script).toContain('priority of newReminder to 9'); // high = 9
      expect(script).toContain('flagged of newReminder to true');
    });

    it('should escape quotes in title', () => {
      const script = generateAddReminderScript({
        title: 'Task with "quotes"',
        list: 'Personal',
        priority: 'none',
        flagged: false,
      });

      expect(script).toContain('Task with \\"quotes\\"');
    });

    it('should include notes when provided', () => {
      const script = generateAddReminderScript({
        title: 'Test',
        list: 'Work',
        priority: 'low',
        flagged: false,
        notes: 'Some notes here',
      });

      expect(script).toContain('body of newReminder to "Some notes here"');
    });

    it('should include due date when provided', () => {
      const script = generateAddReminderScript({
        title: 'Test',
        list: 'Work',
        priority: 'medium',
        flagged: false,
        dueDate: '2026-02-18T14:00:00Z',
      });

      expect(script).toContain('due date of newReminder to date');
      expect(script).toContain('February');
      expect(script).toContain('2026');
    });
  });

  describe('generateListRemindersScript', () => {
    it('should generate list script with specific list', () => {
      const script = generateListRemindersScript({
        list: 'Work',
        includeCompleted: false,
        limit: 50,
      });

      expect(script).toContain('tell application "Reminders"');
      expect(script).toContain('list "Work"');
      expect(script).toContain('whose completed is false');
    });

    it('should include completed when requested', () => {
      const script = generateListRemindersScript({
        list: 'Work',
        includeCompleted: true,
        limit: 50,
      });

      expect(script).not.toContain('whose completed is false');
    });

    it('should list all lists when not specified', () => {
      const script = generateListRemindersScript({
        includeCompleted: false,
        limit: 50,
      });

      expect(script).toContain('set allLists to lists');
      expect(script).toContain('repeat with i from 1 to listCount');
    });
  });

  describe('generateCompleteReminderScript', () => {
    it('should generate complete by ID script', () => {
      const script = generateCompleteReminderScript({
        reminderId: 'test-id-123',
      });

      expect(script).toContain('tell application "Reminders"');
      expect(script).toContain('reminder id "test-id-123"');
      expect(script).toContain('set completed of targetReminder to true');
    });

    it('should generate complete by title script', () => {
      const script = generateCompleteReminderScript({
        title: 'My Task',
        list: 'Work',
      });

      expect(script).toContain('list "Work"');
      expect(script).toContain('whose name is "My Task"');
      expect(script).toContain('completed is false');
    });

    it('should search all lists when list not specified', () => {
      const script = generateCompleteReminderScript({
        title: 'My Task',
      });

      expect(script).toContain('set allLists to lists');
      expect(script).toContain('repeat with i from 1 to listCount');
    });
  });

  describe('generateSearchRemindersScript', () => {
    it('should generate search script with query', () => {
      const script = generateSearchRemindersScript({
        query: 'meeting',
        includeCompleted: false,
        limit: 20,
      });

      expect(script).toContain('tell application "Reminders"');
      expect(script).toContain('contains "meeting"');
      expect(script).toContain('whose completed is false');
    });

    it('should search specific list when provided', () => {
      const script = generateSearchRemindersScript({
        query: 'urgent',
        list: 'Work',
        includeCompleted: false,
        limit: 20,
      });

      expect(script).toContain('list "Work"');
    });

    it('should include completed when requested', () => {
      const script = generateSearchRemindersScript({
        query: 'test',
        includeCompleted: true,
        limit: 20,
      });

      expect(script).not.toContain('and completed is false');
    });
  });
});
