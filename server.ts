import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to retrieve GoogleGenAI client lazily
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const apiKeyPresent = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    hasApiKey: apiKeyPresent,
    apiKeyConfigured: apiKeyPresent,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Stream Chat API Endpoint using Server-Sent Events (SSE)
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required and must not be empty.' });
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(
        `data: ${JSON.stringify({
          error: 'GEMINI_API_KEY is not configured on your server/Render environment. To enable AI Chat: Go to Render Dashboard -> Environment -> Add Environment Variable "GEMINI_API_KEY" with your free Google Gemini API key.',
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const contents = messages.map((m: { role: string; text?: string; content?: string }) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.text || m.content || '' }],
    }));

    const defaultSystemPrompt =
      systemInstruction ||
      `You are Personal OS Assistant, an intelligent executive dashboard AI built to help the user manage daily tasks, priority objectives, focus routines, and productivity metrics. Keep responses clear, helpful, well-structured, and concise. Use Markdown formatting, bullet points, and code blocks where appropriate.`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.7-flash',
      contents,
      config: {
        systemInstruction: defaultSystemPrompt,
        temperature: 0.7,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Gemini Stream Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to stream response from Gemini API.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'An error occurred during streaming.' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// Non-streaming fallback endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured in environment variables.',
      });
    }

    const contents = messages.map((m: { role: string; text?: string; content?: string }) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.text || m.content || '' }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents,
      config: {
        systemInstruction: systemInstruction || 'You are Personal OS Assistant.',
      },
    });

    res.json({ text: response.text || '' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process chat request.' });
  }
});

// AI Smart Email Action (Summarize / Draft Contextual Reply)
app.post('/api/ai/email-draft', async (req, res) => {
  try {
    const { action, subject, from, body, tone = 'professional', customInstruction } = req.body;
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    let prompt = '';
    if (action === 'summarize') {
      prompt = `Analyze the following email and provide a crisp, executive summary in 2-4 bullet points, highlighting key points, pending decisions, and any mentioned dates or action items:

From: ${from || 'Unknown'}
Subject: ${subject || '(No Subject)'}
Body:
${body || '(Empty email)'}`;
    } else {
      prompt = `Draft an email response based on this original message:
From: ${from || 'Unknown'}
Subject: ${subject || '(No Subject)'}
Original Body:
${body || ''}

Response Goal / Action: ${action}
Desired Tone: ${tone}
${customInstruction ? `Special Instructions: ${customInstruction}` : ''}

Output ONLY the drafted reply text (without placeholders like [Your Name] if possible, or use 'Antonio / Personal OS User'). Keep it concise and natural.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: 'You are an executive email writing assistant. Produce clear, polished, and ready-to-send emails.',
        temperature: 0.6,
      },
    });

    res.json({ result: response.text || '' });
  } catch (err: any) {
    console.error('AI Email Draft Error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate email content.' });
  }
});

// AI Smart Schedule Parser (Converts Natural Language to Structured Event)
app.post('/api/ai/parse-schedule', async (req, res) => {
  try {
    const { text, referenceDate = new Date().toISOString() } = req.body;
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const prompt = `Parse the following scheduling request into structured JSON.
Reference Today's Date / Time: ${referenceDate}

Input: "${text}"

Respond ONLY with a valid JSON object matching this exact schema:
{
  "title": "String (concise event title)",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM (24-hour format, e.g. 14:00)",
  "endTime": "HH:MM (24-hour format, e.g. 15:00)",
  "category": "Work" | "Personal" | "Health" | "Meeting" | "Focus",
  "location": "String (or empty string)",
  "description": "String (brief summary of the event)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json({ event: parsedJson });
  } catch (err: any) {
    console.error('AI Schedule Parse Error:', err);
    res.status(500).json({ error: err.message || 'Failed to parse natural language event.' });
  }
});

// AI Reader Mode Article Extractor & Clean Summarizer
app.post('/api/ai/reader-extract', async (req, res) => {
  try {
    const { url, title, rawText } = req.body;
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const prompt = `Analyze this web article and generate a clean, distraction-free reading version and key takeaways.
URL: ${url}
Title: ${title}
${rawText ? `Raw Content Snippet:\n${rawText.slice(0, 3000)}` : ''}

Respond with a JSON object:
{
  "title": "${title || 'Web Article'}",
  "estimatedReadMinutes": number,
  "summaryBullets": ["key takeaway 1", "key takeaway 2", "key takeaway 3"],
  "contentMarkdown": "Clean structured reading markdown with headings, paragraphs, and key quotes."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (err: any) {
    console.error('AI Reader Extract Error:', err);
    res.status(500).json({ error: err.message || 'Failed to extract article reader view.' });
  }
});

// Helper to probe an endpoint with specific method, url, headers, and body
async function probeWorkerEndpoint(
  url: string,
  method: 'GET' | 'POST',
  apiToken?: string,
  bodyData?: any
) {
  const headers: Record<string, string> = {
    'User-Agent': 'PersonalOS-CloudflareMCP-Client/2.0',
    Accept: 'application/json, text/plain, */*',
  };

  if (method === 'POST') {
    headers['Content-Type'] = 'application/json';
  }

  if (apiToken && apiToken.trim()) {
    const tok = apiToken.trim();
    headers['Authorization'] = tok.startsWith('Bearer ') ? tok : `Bearer ${tok}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(bodyData || {}) : undefined,
    signal: AbortSignal.timeout(8000),
  });

  const status = response.status;
  const text = await response.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  return { ok: response.ok, status, text, json, headers: response.headers };
}

// Cloudflare Second Brain & Custom MCP Test Endpoint
app.post('/api/cloudflare/test', async (req, res) => {
  try {
    const { workerUrl, apiToken, protocolMode = 'mcp', httpMethod = 'auto' } = req.body;

    if (!workerUrl || typeof workerUrl !== 'string') {
      return res.status(400).json({ ok: false, error: 'Cloudflare Worker URL is required.' });
    }

    const cleanUrl = workerUrl.trim().replace(/\/$/, '');

    // Step 1: Initial Primary Probe
    let initialMethod: 'GET' | 'POST' =
      httpMethod === 'GET'
        ? 'GET'
        : httpMethod === 'POST'
        ? 'POST'
        : protocolMode === 'mcp'
        ? 'POST'
        : 'GET';

    let initialBody =
      initialMethod === 'POST'
        ? protocolMode === 'mcp'
          ? { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }
          : { query: 'ping', search: 'ping' }
        : undefined;

    let primaryResult: any = null;
    try {
      primaryResult = await probeWorkerEndpoint(cleanUrl, initialMethod, apiToken, initialBody);
    } catch (err: any) {
      primaryResult = { ok: false, status: 0, text: err.message, json: null };
    }

    // If initial request succeeded (HTTP 200..299), return immediately
    if (primaryResult.ok) {
      return res.json({
        ok: true,
        status: primaryResult.status,
        usedMethod: initialMethod,
        resolvedUrl: cleanUrl,
        message: `Successfully connected to Cloudflare Second Brain worker using ${initialMethod}!`,
        protocolMode,
        details: primaryResult.json || primaryResult.text.slice(0, 300),
      });
    }

    // Step 2: Intelligent HTTP 405 (Method Not Allowed) & 404 Auto-Discovery
    // If HTTP 405 or initial failed, systematically probe alternative methods & subpaths
    const probeCandidates: Array<{
      url: string;
      method: 'GET' | 'POST';
      body?: any;
      description: string;
    }> = [
      // 1. Try GET on root with query params
      {
        url: `${cleanUrl}?query=ping&q=ping`,
        method: 'GET',
        description: 'GET with query parameters',
      },
      // 2. Try GET on root directly
      {
        url: cleanUrl,
        method: 'GET',
        description: 'Plain GET',
      },
      // 3. Try standard POST JSON (non-RPC)
      {
        url: cleanUrl,
        method: 'POST',
        body: { query: 'ping', prompt: 'ping', search: 'ping' },
        description: 'Standard JSON POST',
      },
      // 4. Try /mcp subpath
      {
        url: `${cleanUrl}/mcp`,
        method: 'POST',
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
        description: 'POST to /mcp',
      },
      // 5. Try /query subpath
      {
        url: `${cleanUrl}/query`,
        method: 'POST',
        body: { query: 'ping' },
        description: 'POST to /query',
      },
      // 6. Try /api subpath
      {
        url: `${cleanUrl}/api`,
        method: 'GET',
        description: 'GET to /api',
      },
    ];

    for (const candidate of probeCandidates) {
      if (candidate.method === initialMethod && candidate.url === cleanUrl) continue;

      try {
        const probeRes = await probeWorkerEndpoint(
          candidate.url,
          candidate.method,
          apiToken,
          candidate.body
        );

        if (probeRes.ok) {
          return res.json({
            ok: true,
            status: probeRes.status,
            usedMethod: candidate.method,
            recommendedMethod: candidate.method,
            resolvedUrl: candidate.url,
            autoResolved: true,
            message: `Connected successfully! (Auto-resolved HTTP 405 by switching to ${candidate.method})`,
            protocolMode,
            details: probeRes.json || probeRes.text.slice(0, 300),
          });
        }
      } catch {
        // continue probing
      }
    }

    // Step 3: If all probes failed, return detailed diagnostics & actionable resolution
    const status = primaryResult.status || 500;
    const is405 = status === 405;
    const allowHeader = primaryResult.headers?.get?.('Allow') || '';

    return res.json({
      ok: false,
      status,
      usedMethod: initialMethod,
      error: is405
        ? `HTTP 405 Method Not Allowed: Worker rejected ${initialMethod} requests.${
            allowHeader ? ` (Allowed: ${allowHeader})` : ''
          }`
        : `Cloudflare Worker returned HTTP ${status}: ${primaryResult.text.slice(0, 150)}`,
      hint: is405
        ? 'Your Cloudflare Worker only accepts GET requests, or requires CORS OPTIONS / specific subpaths. Switch HTTP Method to GET or use the updated Worker template.'
        : undefined,
      details: primaryResult.json || primaryResult.text.slice(0, 300),
    });
  } catch (err: any) {
    console.error('Cloudflare Worker Test Error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Failed to reach Cloudflare Worker.',
    });
  }
});

// Cloudflare Second Brain Query Proxy Endpoint
app.post('/api/cloudflare/query', async (req, res) => {
  try {
    const { workerUrl, apiToken, protocolMode, httpMethod = 'auto', query } = req.body;

    if (!workerUrl || !query) {
      return res.status(400).json({ error: 'workerUrl and query are required.' });
    }

    const cleanUrl = workerUrl.trim().replace(/\/$/, '');
    const preferredMethod = httpMethod === 'GET' ? 'GET' : 'POST';

    // 1. Try Primary Query
    let targetUrl = cleanUrl;
    let bodyData: any = undefined;

    if (preferredMethod === 'POST') {
      if (protocolMode === 'mcp') {
        bodyData = {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'search_notes',
            arguments: { query },
          },
        };
      } else {
        bodyData = { query, prompt: query, search: query, limit: 5 };
      }
    } else {
      try {
        const urlObj = new URL(cleanUrl);
        urlObj.searchParams.set('query', query);
        urlObj.searchParams.set('q', query);
        urlObj.searchParams.set('search', query);
        targetUrl = urlObj.toString();
      } catch {
        targetUrl = `${cleanUrl}?query=${encodeURIComponent(query)}&q=${encodeURIComponent(query)}`;
      }
    }

    let result = await probeWorkerEndpoint(targetUrl, preferredMethod, apiToken, bodyData);

    // 2. If POST returned 405 Method Not Allowed, automatically fallback to GET query
    if ((result.status === 405 || result.status === 404) && preferredMethod === 'POST') {
      try {
        let fallbackGetUrl = cleanUrl;
        try {
          const urlObj = new URL(cleanUrl);
          urlObj.searchParams.set('query', query);
          urlObj.searchParams.set('q', query);
          urlObj.searchParams.set('search', query);
          fallbackGetUrl = urlObj.toString();
        } catch {
          fallbackGetUrl = `${cleanUrl}?query=${encodeURIComponent(query)}&q=${encodeURIComponent(query)}`;
        }

        const getResult = await probeWorkerEndpoint(fallbackGetUrl, 'GET', apiToken);
        if (getResult.ok || (getResult.status >= 200 && getResult.status < 400)) {
          result = getResult;
        }
      } catch {
        // keep initial result
      }
    }

    return res.json({
      ok: result.ok,
      status: result.status,
      data: result.json || { rawText: result.text },
    });
  } catch (err: any) {
    console.error('Cloudflare Worker Query Error:', err);
    return res.status(500).json({ error: err.message || 'Error querying Cloudflare Second Brain.' });
  }
});

// In-App Web Browser Proxy Endpoint (strips X-Frame-Options to allow safe in-app viewing)
app.get('/api/browser/proxy', async (req, res) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><style>body{font-family:sans-serif;background:#020617;color:#94a3b8;padding:24px;text-align:center;}</style></head>
          <body><h3>No URL specified</h3></body>
        </html>
      `);
    }

    let targetUrl = rawUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8"><style>body{font-family:sans-serif;background:#020617;color:#f87171;padding:24px;text-align:center;}</style></head>
          <body><h3>Invalid Web URL</h3><p>${targetUrl}</p></body>
        </html>
      `);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || 'text/html';

    if (contentType.includes('text/html')) {
      let html = await response.text();
      const baseUrl = response.url || parsedUrl.href;

      // Check if page is an explicit CAPTCHA / Bot Challenge page
      const isCaptchaPage =
        response.status === 403 ||
        response.status === 429 ||
        html.includes('recaptcha/api.js') ||
        html.includes('g-recaptcha') ||
        html.includes('cf-turnstile') ||
        html.includes('challenges.cloudflare.com') ||
        html.includes('hcaptcha.com') ||
        html.includes('Invalid domain for site key') ||
        html.toLowerCase().includes('robot or human') ||
        html.toLowerCase().includes('verify you are human') ||
        html.toLowerCase().includes('bot detection');

      if (isCaptchaPage && (html.includes('g-recaptcha') || html.includes('cf-turnstile') || response.status === 403)) {
        // Return a clean in-app notice instead of broken external reCAPTCHA
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Verification Notice - ${parsedUrl.hostname}</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  background: #020617;
                  color: #94a3b8;
                  padding: 40px 20px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  min-height: 80vh;
                  text-align: center;
                  margin: 0;
                }
                .card {
                  background: #0f172a;
                  border: 1px solid #1e293b;
                  padding: 32px;
                  border-radius: 16px;
                  max-width: 520px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                }
                .icon { font-size: 40px; margin-bottom: 12px; }
                h2 { color: #38bdf8; margin: 0 0 10px 0; font-size: 20px; font-weight: 700; }
                p { font-size: 13px; line-height: 1.6; margin-bottom: 20px; color: #cbd5e1; }
                .url-box {
                  background: #020617;
                  border: 1px solid #334155;
                  padding: 10px 14px;
                  border-radius: 8px;
                  font-family: monospace;
                  font-size: 12px;
                  color: #06b6d4;
                  word-break: break-all;
                  margin-bottom: 24px;
                }
                .btn {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  background: #06b6d4;
                  color: #020617;
                  text-decoration: none;
                  padding: 12px 24px;
                  border-radius: 10px;
                  font-weight: 700;
                  font-size: 14px;
                  transition: background 0.2s, transform 0.1s;
                }
                .btn:hover { background: #22d3ee; transform: scale(1.02); }
                .note { margin-top: 16px; font-size: 11px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">🛡️</div>
                <h2>Interactive Verification Notice</h2>
                <p>
                  <strong>${parsedUrl.hostname}</strong> requires interactive bot verification (CAPTCHA).
                  Security site keys are bound to <em>${parsedUrl.hostname}</em> and cannot run inside an embedded proxy.
                </p>
                <div class="url-box">${targetUrl}</div>
                <a class="btn" href="${targetUrl}" target="_blank" rel="noopener noreferrer">
                  Open Directly in New Tab ↗
                </a>
                <div class="note">Opening directly will let you complete the verification securely on ${parsedUrl.hostname}.</div>
              </div>
            </body>
          </html>
        `);
      }

      // Neutralize external reCAPTCHA scripts to prevent "Invalid domain for site key" red boxes
      html = html.replace(/<script[^>]*src=["'][^"']*(recaptcha|hcaptcha|turnstile)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi, '');
      html = html.replace(/<div[^>]*class=["'][^"']*g-recaptcha[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

      // Inject <base> tag so relative links, CSS, and JS load properly
      const baseTag = `<base href="${baseUrl}">`;
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<head ')) {
        html = html.replace(/<head[^>]*>/, `$&${baseTag}`);
      } else {
        html = `${baseTag}${html}`;
      }

      // Inject safe mock grecaptcha and navigation interceptor script
      const script = `
        <script>
          (function() {
            // Mock grecaptcha to prevent undefined errors when stripped
            window.grecaptcha = window.grecaptcha || {
              render: function() { return 0; },
              reset: function() {},
              getResponse: function() { return ""; },
              execute: function() { return Promise.resolve(""); },
              ready: function(cb) { if (typeof cb === 'function') cb(); }
            };

            // Intercept link clicks and forward to parent browser
            document.addEventListener('click', function(e) {
              var target = e.target.closest('a');
              if (target && target.href) {
                var href = target.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                  e.preventDefault();
                  var fullUrl = target.href;
                  try {
                    window.parent.postMessage({ type: 'BROWSER_NAVIGATE', url: fullUrl }, '*');
                  } catch(err) {}
                }
              }
            }, true);
          })();
        </script>
      `;

      if (html.includes('</body>')) {
        html = html.replace('</body>', `${script}</body>`);
      } else {
        html = `${html}${script}`;
      }

      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } else {
      // Forward binary assets / images / stylesheets / JSON
      const buffer = await response.arrayBuffer();
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      res.setHeader('Content-Type', contentType);
      return res.send(Buffer.from(buffer));
    }
  } catch (err: any) {
    console.error('Browser proxy error:', err.message);
    const targetUrl = (req.query.url as string) || '';
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #020617;
              color: #94a3b8;
              padding: 40px 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 80vh;
              text-align: center;
              margin: 0;
            }
            .card {
              background: #0f172a;
              border: 1px solid #1e293b;
              padding: 32px;
              border-radius: 16px;
              max-width: 520px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            }
            h2 { color: #38bdf8; margin-top: 0; font-size: 20px; font-weight: 700; }
            p { font-size: 14px; line-height: 1.6; margin-bottom: 20px; color: #cbd5e1; }
            .url-box {
              background: #020617;
              border: 1px solid #334155;
              padding: 10px 14px;
              border-radius: 8px;
              font-family: monospace;
              font-size: 12px;
              color: #06b6d4;
              word-break: break-all;
              margin-bottom: 24px;
            }
            .btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: #06b6d4;
              color: #020617;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 10px;
              font-weight: 700;
              font-size: 14px;
              transition: background 0.2s;
            }
            .btn:hover { background: #22d3ee; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🛡️ In-App Web View Notice</h2>
            <p>This destination website restricts automated proxy embedding or requires interactive browser authentication.</p>
            <div class="url-box">${targetUrl}</div>
            <a class="btn" href="${targetUrl}" target="_blank" rel="noopener noreferrer">
              Open Directly in New Tab ↗
            </a>
          </div>
        </body>
      </html>
    `);
  }
});

// Instant Search & Article Summary API for In-App Browser
app.get('/api/browser/search', async (req, res) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) return res.json({ results: [] });

    // Query Wikipedia OpenSearch API
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=6&namespace=0&format=json`;
    const wikiRes = await fetch(wikiUrl, { signal: AbortSignal.timeout(5000) });
    const wikiData = await wikiRes.json();

    const results: Array<{ title: string; snippet: string; url: string; source: string }> = [];

    if (Array.isArray(wikiData) && wikiData.length >= 4) {
      const titles = wikiData[1] || [];
      const snippets = wikiData[2] || [];
      const links = wikiData[3] || [];

      for (let i = 0; i < titles.length; i++) {
        if (titles[i] && links[i]) {
          results.push({
            title: titles[i],
            snippet: snippets[i] || `Wikipedia article about ${titles[i]}`,
            url: links[i],
            source: 'Wikipedia',
          });
        }
      }
    }

    return res.json({ query, results });
  } catch (err: any) {
    return res.json({ query: req.query.q, results: [] });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Personal OS Hub] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
