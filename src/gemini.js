import { fetchWithTimeout } from './http.js';

export class GeminiClient {
  constructor({ apiKey, model, modelFallbacks = [], systemPrompt, timeoutMs = 20_000 }) {
    this.apiKey = apiKey;
    this.model = model;
    this.modelFallbacks = modelFallbacks;
    this.systemPrompt = systemPrompt;
    this.timeoutMs = timeoutMs;
  }

  async reply({ input, previousInteractionId }) {
    const models = [...new Set([this.model, ...this.modelFallbacks])];
    let lastError;

    for (const model of models) {
      try {
        return await this.replyWithModel({ model, input, previousInteractionId });
      } catch (error) {
        lastError = error;
        if (!isRetryableModelError(error)) throw error;
        console.warn(`Gemini model ${model} failed, trying fallback`, { error: error.message });
      }
    }

    throw lastError;
  }

  async replyWithModel({ model, input, previousInteractionId }) {
    const payload = {
      model,
      input,
      system_instruction: this.systemPrompt,
      generation_config: {
        temperature: 0.7,
        thinking_level: 'low',
      },
    };

    if (previousInteractionId) {
      payload.previous_interaction_id = previousInteractionId;
    }

    const response = await fetchWithTimeout(
      'https://generativelanguage.googleapis.com/v1beta/interactions',
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
      this.timeoutMs
    );

    const text = await response.text();
    const data = safeJson(text);

    if (!response.ok) {
      throw new Error(`Gemini request failed (${response.status}): ${text}`);
    }

    return {
      interactionId: data?.id,
      text: extractOutputText(data) || 'Извините, я пока не смог сформировать ответ. Напишите, пожалуйста, еще раз.',
      raw: data,
    };
  }
}

function extractOutputText(data) {
  if (typeof data?.output_text === 'string') return data.output_text.trim();
  if (typeof data?.outputText === 'string') return data.outputText.trim();

  const chunks = [];
  for (const step of data?.steps || []) {
    collectText(step, chunks);
  }
  return chunks.join('\n').trim();
}

function collectText(value, chunks) {
  if (!value || typeof value !== 'object') return;

  if (typeof value.text === 'string') chunks.push(value.text);

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) collectText(item, chunks);
    } else if (child && typeof child === 'object') {
      collectText(child, chunks);
    }
  }
}

function isRetryableModelError(error) {
  return /429|500|503|high demand|try again later|timed out/i.test(error.message);
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
