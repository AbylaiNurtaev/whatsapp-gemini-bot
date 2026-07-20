import { fetchWithTimeout } from './http.js';

export class WappiClient {
  constructor({ apiToken, profileId, baseUrl, timeoutMs = 20_000 }) {
    this.apiToken = apiToken;
    this.profileId = profileId;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  async sendText({ chatId, recipient, body }) {
    if (!chatId && !recipient) {
      throw new Error('sendText requires chatId or recipient');
    }

    const url = new URL('/api/sync/message/send', this.baseUrl);
    url.searchParams.set('profile_id', this.profileId);

    const payload = chatId
      ? { chat_id: chatId, body }
      : { recipient, body };

    const response = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: this.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      this.timeoutMs
    );

    const text = await response.text();
    const data = safeJson(text);

    if (!response.ok) {
      throw new Error(`Wappi send failed (${response.status}): ${text}`);
    }

    return data ?? text;
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
