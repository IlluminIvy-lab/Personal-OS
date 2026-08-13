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

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Messages array is required.' }),
      };
    }

    const ai = getGenAIClient();
    if (!ai) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
        body: `data: ${JSON.stringify({
          error: 'GEMINI_API_KEY is missing or invalid in Netlify Environment Variables. Please add GEMINI_API_KEY in Netlify Site Configuration.',
        })}\n\ndata: [DONE]\n\n`,
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
        systemInstruction:
          systemInstruction ||
          'You are Personal OS Assistant, an intelligent executive dashboard AI built to help the user manage daily tasks, priority objectives, focus routines, and productivity metrics. Keep responses clear, helpful, well-structured, and concise.',
        temperature: 0.7,
      },
    });

    const text = response.text || '';
    const sseBody = `data: ${JSON.stringify({ text })}\n\ndata: [DONE]\n\n`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      body: sseBody,
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Failed to process chat request.' }),
    };
  }
}
