import { loadConfig } from '../src/config.js';

const config = loadConfig();

if (!config.publicBaseUrl) {
  throw new Error('Set PUBLIC_BASE_URL before running setup:webhook');
}

const webhookUrl = new URL('/webhook', config.publicBaseUrl).toString();

await callWappi('/api/webhook/url/set', {
  url: webhookUrl,
  ...(config.webhookAuth ? { auth: config.webhookAuth } : {}),
});

await callWappi('/api/webhook/types/set', undefined, [
  'incoming_message',
  'authorization_status',
  'application_status',
]);

console.log(`Webhook configured: ${webhookUrl}`);

async function callWappi(path, query = {}, body) {
  const url = new URL(path, config.wappi.baseUrl);
  url.searchParams.set('profile_id', config.wappi.profileId);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: config.wappi.apiToken,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Wappi ${path} failed (${response.status}): ${text}`);
  }

  return text;
}
