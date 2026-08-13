export async function handler() {
  const apiKeyPresent = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: 'ok',
      hasApiKey: apiKeyPresent,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
    }),
  };
}
