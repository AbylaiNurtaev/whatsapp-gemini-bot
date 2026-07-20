export function parseIncomingMessages(payload) {
  if (!payload || typeof payload !== 'object') return [];

  const messages = [];
  const candidates = [
    payload.message,
    ...(Array.isArray(payload.messages) ? payload.messages : []),
    ...(Array.isArray(payload.data?.messages) ? payload.data.messages : []),
  ].filter(Boolean);

  if (looksLikeMessage(payload)) {
    candidates.push(payload);
  }

  for (const item of candidates) {
    const parsed = parseMessage(item, payload);
    if (parsed) messages.push(parsed);
  }

  return messages.filter((message) => {
    const eventType = message.eventType || payload.type || payload.webhook_type || payload.event;
    if (eventType && eventType !== 'incoming_message') return false;
    if (message.fromMe || message.isFromApi) return false;
    return Boolean(message.chatId || message.recipient) && Boolean(message.text);
  });
}

function parseMessage(message, root) {
  const text =
    message.body ||
    message.text ||
    message.message ||
    message.caption ||
    message.content?.text ||
    message.text?.body;

  const chatId =
    message.chat_id ||
    message.chatId ||
    message.from ||
    message.sender ||
    message.author ||
    message.chat?.id ||
    root.chat_id ||
    root.chatId;

  const recipient =
    message.recipient ||
    message.phone ||
    message.from_phone ||
    root.recipient ||
    root.phone;

  return {
    id: message.id || message.message_id || message.stanza_id || root.id || root.message_id,
    chatId,
    recipient,
    text: typeof text === 'string' ? text.trim() : '',
    eventType: message.type_webhook || message.webhook_type || message.event || root.type_webhook,
    fromMe: Boolean(message.fromMe || message.from_me || message.is_from_me || message.isMe),
    isFromApi: Boolean(message.isFromAPI || message.is_from_api),
  };
}

function looksLikeMessage(payload) {
  return Boolean(
    payload.body ||
      payload.text ||
      payload.message ||
      payload.chat_id ||
      payload.chatId ||
      payload.recipient
  );
}
