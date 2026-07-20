import express from 'express';
import { loadConfig } from './config.js';
import { GeminiClient } from './gemini.js';
import { ExpiringMap } from './memory-store.js';
import { WappiClient } from './wappi.js';
import { parseIncomingMessages } from './webhook-parser.js';

const config = loadConfig();
const app = express();
const gemini = new GeminiClient(config.gemini);
const wappi = new WappiClient(config.wappi);
const conversations = new ExpiringMap(7 * 24 * 60 * 60 * 1000);
const processedMessages = new ExpiringMap(24 * 60 * 60 * 1000);

app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'whatsapp-gemini-bot' });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/debug/parse-webhook', (req, res) => {
  if (process.env.NODE_ENV === 'production' && !config.webhookAuth) {
    return res.status(404).json({ ok: false });
  }

  res.json({
    ok: true,
    parsed: parseIncomingMessages(req.body),
  });
});

app.post('/webhook', async (req, res) => {
  if (!isAuthorizedWebhook(req)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized webhook' });
  }

  const incomingMessages = parseIncomingMessages(req.body);
  console.log('Webhook received', {
    accepted: incomingMessages.length,
    payloadKeys: Object.keys(req.body || {}),
    event: req.body?.event,
    type: req.body?.type,
    typeWebhook: req.body?.type_webhook,
    webhookType: req.body?.webhook_type,
  });

  res.status(200).json({ ok: true, accepted: incomingMessages.length });

  for (const message of incomingMessages) {
    handleMessage(message).catch((error) => {
      console.error('Failed to process message', {
        error: error.message,
        messageId: message.id,
        chatId: message.chatId,
      });
    });
  }
});

async function handleMessage(message) {
  const dedupeKey = message.id || `${message.chatId || message.recipient}:${message.text}`;
  if (processedMessages.has(dedupeKey)) {
    console.log('Skipping duplicate incoming message', {
      messageId: message.id,
      chatId: message.chatId,
    });
    return;
  }
  processedMessages.set(dedupeKey, true);

  const chatKey = message.chatId || message.recipient;
  console.log('Handling incoming message', {
    messageId: message.id,
    chatId: message.chatId,
    recipient: message.recipient,
    textLength: message.text.length,
  });

  const previousInteractionId = conversations.get(chatKey);
  const geminiResponse = await gemini.reply({
    input: message.text,
    previousInteractionId,
  });

  console.log('Gemini response generated', {
    chatKey,
    hasInteractionId: Boolean(geminiResponse.interactionId),
    textLength: geminiResponse.text.length,
  });

  if (geminiResponse.interactionId) {
    conversations.set(chatKey, geminiResponse.interactionId);
  }

  const result = await wappi.sendText({
    chatId: message.chatId,
    recipient: message.recipient,
    body: trimForWhatsApp(geminiResponse.text),
  });

  console.log('Wappi reply sent', {
    chatId: message.chatId,
    recipient: message.recipient,
    result,
  });
}

function isAuthorizedWebhook(req) {
  if (!config.webhookAuth) return true;

  const possibleValues = [
    req.get('authorization'),
    req.get('webhook'),
    req.get('x-webhook-auth'),
    req.get('x-wappi-auth'),
    req.get('x-webhook-secret'),
  ].filter(Boolean);

  return possibleValues.some((value) => {
    const normalized = value.replace(/^Bearer\s+/i, '').trim();
    return normalized === config.webhookAuth;
  });
}

function trimForWhatsApp(text) {
  return text.length > 3500 ? `${text.slice(0, 3490)}...` : text;
}

app.listen(config.port, () => {
  console.log(`WhatsApp Gemini bot is listening on port ${config.port}`);
});
