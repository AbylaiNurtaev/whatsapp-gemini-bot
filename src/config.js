import 'dotenv/config';
import { SYSTEM_PROMPT } from './system-prompt.js';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function loadConfig() {
  return {
    port: Number(process.env.PORT || 3000),
    httpTimeoutMs: Number(process.env.HTTP_TIMEOUT_MS || 20_000),
    wappi: {
      apiToken: required('WAPPI_API_TOKEN'),
      profileId: required('WAPPI_PROFILE_ID'),
      baseUrl: process.env.WAPPI_BASE_URL?.trim() || 'https://wappi.pro',
      timeoutMs: Number(process.env.HTTP_TIMEOUT_MS || 20_000),
    },
    gemini: {
      apiKey: required('GEMINI_API_KEY'),
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash-lite',
      modelFallbacks: (process.env.GEMINI_MODEL_FALLBACKS || 'gemini-3.1-flash-lite,gemini-2.5-flash')
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean),
      timeoutMs: Number(process.env.HTTP_TIMEOUT_MS || 20_000),
      systemPrompt: SYSTEM_PROMPT,
    },
    webhookAuth: process.env.WEBHOOK_AUTH?.trim() || '',
    publicBaseUrl: process.env.PUBLIC_BASE_URL?.trim() || '',
  };
}
