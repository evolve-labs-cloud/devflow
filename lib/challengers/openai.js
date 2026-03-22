/**
 * OpenAI model caller for the Challenger agent.
 * Uses Node.js built-in https — no external dependencies.
 *
 * Supported models (via /v1/chat/completions):
 *   o3-mini  — default, fast reasoning, ~$0.03/review
 *   o3       — deep analysis, ~$0.28/review
 *   gpt-5    — GPT-5, uses temperature instead of reasoning_effort
 *
 * NOTE: codex-mini-latest is NOT available via the standard API —
 * it is exclusive to the OpenAI Codex CLI and returns 404 here.
 */
const https = require('node:https');

const MAX_INPUT_CHARS = 80000; // ~20k tokens
const DEFAULT_MODEL = 'gpt-5.4';

/**
 * Returns true for o-series reasoning models (o1, o3, o3-mini, o4-mini, etc.)
 * These use reasoning_effort instead of temperature.
 * @param {string} model
 */
function isReasoningModel(model) {
  return /^o\d/.test(model); // o1, o3, o3-mini, o4-mini, etc.
}

/**
 * @param {string} prompt
 * @param {string} apiKey
 * @param {number} timeoutSec
 * @param {string} model - 'o3-mini' (default), 'o3', 'gpt-5', etc.
 */
function callOpenAI(prompt, apiKey, timeoutSec = 180, model = DEFAULT_MODEL) {
  // Truncate to control cost
  const truncated =
    prompt.length > MAX_INPUT_CHARS
      ? prompt.slice(0, MAX_INPUT_CHARS) + '\n\n... [truncated for cost control]'
      : prompt;

  // o-series: reasoning_effort. GPT-series: no extra params (use API defaults).
  const modelParams = isReasoningModel(model)
    ? { reasoning_effort: 'high' }
    : {};

  const body = JSON.stringify({
    model,
    messages: [{ role: 'user', content: truncated }],
    ...modelParams,
    stream: true,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: timeoutSec * 1000,
    };

    let fullText = '';

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', (chunk) => (errBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(errBody);
            reject(new Error(`OpenAI error ${res.statusCode}: ${parsed.error?.message || errBody}`));
          } catch {
            reject(new Error(`OpenAI error ${res.statusCode}: ${errBody}`));
          }
        });
        return;
      }

      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              process.stdout.write(delta);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      });

      res.on('end', () => {
        process.stdout.write('\n');
        resolve(fullText.trim());
      });

      res.on('error', reject);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`OpenAI ${model} timeout after ${timeoutSec}s`));
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        reject(new Error('Cannot reach OpenAI API. Check your internet connection.'));
      } else {
        reject(err);
      }
    });

    req.write(body);
    req.end();
  });
}

module.exports = { callOpenAI };
