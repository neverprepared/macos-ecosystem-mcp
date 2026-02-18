/**
 * Tests for Calendar app script generation
 */

import { describe, it, expect } from 'vitest';
import {
  generateCreateEventScript,
  generateListEventsScript,
  generateUpdateEventScript,
  generateDeleteEventScript,
} from '../../../src/apps/calendar/scripts.js';

describe('Calendar Script Generation', () => {
  describe('generateCreateEventScript', () => {
    it('should generate basic event creation script', () => {
      const script = generateCreateEventScript({
        title: 'Team Meeting',
        startDate: '2026-02-18T14:00:00Z',
        endDate: '2026-02-18T15:00:00Z',
        calendar: 'Work',
        allDay: false,
      });

      expect(script).toContain('tell application "Calendar"');
      expect(script).toContain('calendar "Work"');
      expect(script).toContain('Team Meeting');
      expect(script).toContain('set allday event of newEvent to false');
    });

    it('should include location when provided', () => {
      const script = generateCreateEventScript({
        title: 'Meeting',
        startDate: '2026-02-18T14:00:00Z',
        endDate: '2026-02-18T15:00:00Z',
        calendar: 'Work',
        allDay: false,
        location: 'Conference Room A',
      });

      expect(script).toContain('location of newEvent to "Conference Room A"');
    });

    it('should include notes when provided', () => {
      const script = generateCreateEventScript({
        title: 'Meeting',
        startDate: '2026-02-18T14:00:00Z',
        endDate: '2026-02-18T15:00:00Z',
        calendar: 'Work',
        allDay: false,
        notes: 'Important meeting notes',
      });

      expect(script).toContain('description of newEvent to "Important meeting notes"');
    });

    it('should add alerts when provided', () => {
      const script = generateCreateEventScript({
        title: 'Meeting',
        startDate: '2026-02-18T14:00:00Z',
        endDate: '2026-02-18T15:00:00Z',
        calendar: 'Work',
        allDay: false,
        alerts: [15, 60], // 15 min and 1 hour before
      });

      expect(script).toContain('trigger interval:-15');
      expect(script).toContain('trigger interval:-60');
    });

    it('should handle all-day events', () => {
      const script = generateCreateEventScript({
        title: 'Birthday',
        startDate: '2026-02-18T00:00:00Z',
        endDate: '2026-02-18T23:59:59Z',
        calendar: 'Personal',
        allDay: true,
      });

      expect(script).toContain('set allday event of newEvent to true');
    });
  });

  describe('generateListEventsScript', () => {
    it('should generate list events script for specific calendar', () => {
      const script = generateListEventsScript({
        startDate: '2026-02-17T00:00:00Z',
        endDate: '2026-02-24T00:00:00Z',
        calendar: 'Work',
        limit: 50,
      });

      expect(script).toContain('tell application "Calendar"');
      expect(script).toContain('calendar "Work"');
      expect(script).toContain('start date ≥ startDate');
      expect(script).toContain('start date ≤ endDate');
    });

    it('should list all calendars when not specified', () => {
      const script = generateListEventsScript({
        startDate: '2026-02-17T00:00:00Z',
        endDate: '2026-02-24T00:00:00Z',
        limit: 50,
      });

      expect(script).toContain('set allCalendars to calendars');
      expect(script).toContain('repeat with cal in allCalendars');
    });
  });

  describe('generateUpdateEventScript', () => {
    it('should update event title', () => {
      const script = generateUpdateEventScript({
        eventId: 'test-event-id',
        title: 'Updated Meeting Title',
      });

      expect(script).toContain('first event whose uid is "test-event-id"');
      expect(script).toContain('summary of targetEvent to "Updated Meeting Title"');
    });

    it('should update multiple properties', () => {
      const script = generateUpdateEventScript({
        eventId: 'test-event-id',
        title: 'New Title',
        location: 'New Location',
        notes: 'New notes',
      });

      expect(script).toContain('summary of targetEvent to "New Title"');
      expect(script).toContain('location of targetEvent to "New Location"');
      expect(script).toContain('description of targetEvent to "New notes"');
    });
  });

  describe('generateDeleteEventScript', () => {
    it('should delete by event ID', () => {
      const script = generateDeleteEventScript({
        eventId: 'test-event-id',
      });

      expect(script).toContain('first event whose uid is "test-event-id"');
      expect(script).toContain('delete targetEvent');
    });

    it('should delete by title', () => {
      const script = generateDeleteEventScript({
        title: 'Meeting to Delete',
      });

      expect(script).toContain('whose summary is "Meeting to Delete"');
      expect(script).toContain('delete targetEvent');
    });

    it('should delete by title with date filter', () => {
      const script = generateDeleteEventScript({
        title: 'Meeting',
        date: '2026-02-18T14:00:00Z',
      });

      expect(script).toContain('whose summary is "Meeting"');
      expect(script).toContain('and start date contains targetDate');
    });
  });
});
