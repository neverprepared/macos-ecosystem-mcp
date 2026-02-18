/**
 * Tests for Notes app script generation
 */

import { describe, it, expect } from 'vitest';
import {
  generateCreateNoteScript,
  generateAppendNoteScript,
  generateSearchNotesScript,
} from '../../../src/apps/notes/scripts.js';

describe('Notes Script Generation', () => {
  describe('generateCreateNoteScript', () => {
    it('should generate create note script', () => {
      const script = generateCreateNoteScript({
        title: 'My Note',
        body: 'This is the note content',
        folder: 'Work',
      });

      expect(script).toContain('tell application "Notes"');
      expect(script).toContain('folder "Work"');
      expect(script).toContain('<h1>My Note</h1>');
      expect(script).toContain('This is the note content');
    });

    it('should escape special characters in title and body', () => {
      const script = generateCreateNoteScript({
        title: 'Note with "quotes"',
        body: 'Body with "quotes" too',
        folder: 'Notes',
      });

      expect(script).toContain('Note with \\"quotes\\"');
      expect(script).toContain('Body with \\"quotes\\" too');
    });

    it('should handle HTML in body', () => {
      const script = generateCreateNoteScript({
        title: 'Formatted Note',
        body: '<p>Paragraph</p><ul><li>Item 1</li></ul>',
        folder: 'Notes',
      });

      expect(script).toContain('<p>Paragraph</p>');
      expect(script).toContain('<ul><li>Item 1</li></ul>');
    });
  });

  describe('generateAppendNoteScript', () => {
    it('should append by note ID', () => {
      const script = generateAppendNoteScript({
        noteId: 'test-note-id',
        content: 'Additional content',
      });

      expect(script).toContain('tell application "Notes"');
      expect(script).toContain('note id "test-note-id"');
      expect(script).toContain('<div>Additional content</div>');
    });

    it('should append by title in specific folder', () => {
      const script = generateAppendNoteScript({
        title: 'My Note',
        folder: 'Work',
        content: 'More content',
      });

      expect(script).toContain('folder "Work"');
      expect(script).toContain('whose name is "My Note"');
      expect(script).toContain('<div>More content</div>');
    });

    it('should search all folders when folder not specified', () => {
      const script = generateAppendNoteScript({
        title: 'My Note',
        content: 'New content',
      });

      expect(script).toContain('set allFolders to folders');
      expect(script).toContain('repeat with fld in allFolders');
    });
  });

  describe('generateSearchNotesScript', () => {
    it('should generate search script', () => {
      const script = generateSearchNotesScript({
        query: 'meeting',
        limit: 20,
      });

      expect(script).toContain('tell application "Notes"');
      expect(script).toContain('contains "meeting"');
    });

    it('should search in specific folder', () => {
      const script = generateSearchNotesScript({
        query: 'project',
        folder: 'Work',
        limit: 20,
      });

      expect(script).toContain('folder "Work"');
      expect(script).toContain('contains "project"');
    });

    it('should search all folders when not specified', () => {
      const script = generateSearchNotesScript({
        query: 'todo',
        limit: 20,
      });

      expect(script).toContain('set allFolders to folders');
      expect(script).toContain('repeat with fld in allFolders');
    });

    it('should truncate excerpt to 200 characters', () => {
      const script = generateSearchNotesScript({
        query: 'test',
        limit: 20,
      });

      expect(script).toContain('text 1 thru 200');
    });
  });
});
