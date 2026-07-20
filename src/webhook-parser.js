export function parseIncomingMessages(payload) {
  if (!payload || typeof payload !== 'object') return [];

  const messages = [];
  const candidates = [
    payload.message,
    payload.data,
    payload.payload,
    ...(Array.isArray(payload.messages) ? payload.messages : []),
    ...(Array.isArray(payload.data?.messages) ? payload.data.messages : []),
    ...(Array.isArray(payload.payload?.messages) ? payload.payload.messages : []),
  ].filter(Boolean);

  if (looksLikeMessage(payload)) {
    candidates.push(payload);
  }

  for (const item of candidates) {
    const parsed = parseMessage(item, payload);
    if (parsed) messages.push(parsed);
  }

  return messages.filter((message) => {
    const eventType =
      message.eventType ||
      payload.type_webhook ||
      payload.webhook_type ||
      payload.type ||
      payload.event?.type ||
      payload.event;
    if (eventType && !isIncomingEvent(eventType)) return false;
    if (message.fromMe || message.isFromApi) return false;
    return Boolean(message.chatId || message.recipient) && Boolean(message.text);
  });
}

function parseMessage(message, root) {
  const text =
    message.body ||
    message.text?.body ||
    message.message?.body ||
    message.message?.text ||
    message.messageData?.textMessageData?.textMessage ||
    message.messageData?.extendedTextMessageData?.text ||
    message.messageData?.caption ||
    message.text ||
    message.message ||
    message.caption ||
    message.content?.text ||
    message.content?.body;

  const chatId =
    message.chat_id ||
    message.chatId ||
    message.chat_id?._serialized ||
    message.chatId?._serialized ||
    message.id?.remote ||
    message.senderData?.chatId ||
    message.senderData?.sender ||
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
    message.senderData?.sender ||
    root.recipient ||
    root.phone;

  return {
    id: message.id || message.message_id || message.stanza_id || root.id || root.message_id,
    chatId,
    recipient,
    text: typeof text === 'string' ? text.trim() : '',
    eventType:
      message.type_webhook ||
      message.webhook_type ||
      message.event?.type ||
      message.event ||
      root.type_webhook ||
      root.webhook_type,
    fromMe: Boolean(
      message.fromMe ||
        message.from_me ||
        message.is_from_me ||
        message.isMe ||
        message.fromMe === true ||
        message.id?.fromMe === true
    ),
    isFromApi: Boolean(message.isFromAPI || message.is_from_api),
  };
}

function looksLikeMessage(payload) {
  return Boolean(
    payload.body ||
      payload.text ||
      payload.message ||
      payload.messageData ||
      payload.chat_id ||
      payload.chatId ||
      payload.senderData ||
      payload.recipient
  );
}

function isIncomingEvent(eventType) {
  return [
    'incoming_message',
    'message',
    'messages',
    'messages.post',
    'incoming',
  ].includes(String(eventType));
}
