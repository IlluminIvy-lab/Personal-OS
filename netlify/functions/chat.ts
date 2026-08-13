import { GoogleGenAI } from '@google/genai';

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { messages, systemInstruction } = JSON.parse(event.body || '{}');
    const ai = getGenAIClient();
    if (!ai) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured in Netlify environment variables.' }),
      };
    }

    const contents = messages.map((m: { role: string; text?: string; content?: string }) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.text || m.content || '' }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction: systemInstruction || 'You are Personal OS Assistant.',
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: response.text || '' }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Failed to process chat request.' }),
    };
  }
}
