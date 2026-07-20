import assert from 'node:assert/strict';
import test from 'node:test';
import { recipientFromChatId } from '../src/wappi.js';

test('converts Wappi personal chat id to recipient phone', () => {
  assert.equal(recipientFromChatId('77715943738@c.us'), '77715943738');
});

test('does not convert group chat ids', () => {
  assert.equal(recipientFromChatId('77715943738-123@g.us'), '');
});
