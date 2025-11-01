// netlify/functions/api.ts - SIMPLE VERSION WITHOUT EXTERNAL DEPENDENCIES
export const handler = async (event: any) => {
  const path: string = event.path || "";
  const method: string = event.httpMethod || "GET";
  const queryParams = event.queryStringParameters || {};

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  } as const;

  if (method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Basic router
  if (path.includes("/api/state") && method === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        team: queryParams.team || "default",
        status: "active",
        members: [],
        lastSpin: null,
        message: "State endpoint working",
      }),
    };
  }

  if (path.includes("/api/events") && method === "GET") {
    const accept = (event.headers?.accept as string) || "";
    if (accept.includes("text/event-stream")) {
      const sseHeaders = {
        ...headers,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      };
      const payload = {
        type: "state",
        team: queryParams.team || "default",
        note: "SSE single-shot; use polling or /api/events-sse",
        timestamp: new Date().toISOString(),
      };
      const body = `retry: 15000\n` + `data: ${JSON.stringify(payload)}\n\n`;
      return { statusCode: 200, headers: sseHeaders, body };
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        events: [],
        team: queryParams.team || "default",
        message: "Events endpoint working",
      }),
    };
  }

  if (path.includes("/api/members/add") && method === "POST") {
    const body = safeJson(event.body);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        member: { name: (body?.name || "New Member") as string, id: Date.now() },
        message: "Member added successfully",
      }),
    };
  }

  if (path.includes("/api/spin/start") && method === "POST") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        spinId: `spin-${Date.now()}`,
        message: "Spin started successfully",
      }),
    };
  }

  // History topic updates (stubs)
  if (path.includes("/api/history/set-last-topic") && method === "POST") {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }
  if (path.includes("/api/history/update-topic") && method === "POST") {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  // DELETE endpoints
  if (method === "DELETE" && path.includes("/api/history/")) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }
  if (method === "DELETE" && path.includes("/api/members/") && !path.includes("/api/members/add")) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  // Default 404 for unknown routes
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: "Endpoint not found", path, method }),
  };
};

function safeJson(input: string | null | undefined): any {
  if (!input) return {};
  try { return JSON.parse(input); } catch { return {}; }
}
