export const handler = async (event: any) => {
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  } as const;

  // Single-shot SSE payload with retry hint; Netlify Functions don't keep connections open
  const team = (event.queryStringParameters?.team as string) || "default";
  const payload = {
    type: "state",
    team,
    message: "SSE connected (single-shot); use polling for updates in serverless",
    timestamp: new Date().toISOString(),
  };

  const body = `retry: 15000\n` + `data: ${JSON.stringify(payload)}\n\n`;

  return { statusCode: 200, headers, body };
};
