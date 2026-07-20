import assert from 'node:assert/strict';
import test from 'node:test';
import { parseIncomingMessages } from '../src/webhook-parser.js';

test('parses a direct Wappi-style incoming message', () => {
  const messages = parseIncomingMessages({
    type_webhook: 'incoming_message',
    id: 'msg-1',
    chat_id: '77010000000@c.us',
    body: 'Привет',
    isFromAPI: false,
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].chatId, '77010000000@c.us');
  assert.equal(messages[0].text, 'Привет');
});

test('ignores outgoing api events', () => {
  const messages = parseIncomingMessages({
    type_webhook: 'outgoing_message_api',
    chat_id: '77010000000@c.us',
    body: 'Ответ',
    isFromAPI: true,
  });

  assert.deepEqual(messages, []);
});

test('parses messages from array payloads', () => {
  const messages = parseIncomingMessages({
    messages: [
      {
        type_webhook: 'incoming_message',
        id: 'msg-2',
        chatId: '77020000000@c.us',
        text: 'Нужна консультация',
      },
    ],
  });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].id, 'msg-2');
});
