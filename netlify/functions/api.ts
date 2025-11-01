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
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        events: [],
        team: queryParams.team || "default",
        message: "Events endpoint working (SSE not supported in serverless)",
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
