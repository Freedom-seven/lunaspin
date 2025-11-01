export function getTeamId() {
  const u = new URL(window.location.href);
  return u.searchParams.get("team") || "default";
}

function base() {
  return ""; // same-origin
}

export async function apiGet<T>(path: string) {
  const team = getTeamId();
  const res = await fetch(`${base()}${path}?team=${encodeURIComponent(team)}`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body?: any) {
  const team = getTeamId();
  const res = await fetch(`${base()}${path}?team=${encodeURIComponent(team)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function apiDelete<T>(path: string) {
  const team = getTeamId();
  const res = await fetch(`${base()}${path}?team=${encodeURIComponent(team)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export type ServerEvent =
  | { type: "state"; team: string; state: any }
  | { type: "spin"; team: string; payload: any };

export function subscribe(onEvent: (ev: ServerEvent) => void) {
  const team = getTeamId();
  // Use dedicated SSE endpoint routed via Netlify to ensure correct MIME type
  const es = new EventSource(`/api/events-sse?team=${encodeURIComponent(team)}`);
  let stopped = false;
  let pollId: number | null = null;

  function startPolling() {
    if (pollId != null) return;
    pollId = window.setInterval(async () => {
      try {
        const { state } = await apiGet<{ team: string; state: any }>("/api/state");
        if (!stopped) onEvent({ type: "state", team, state } as any);
      } catch (err) {
        // swallow polling errors; will retry next tick
      }
    }, 15000);
  }

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch {}
  };
  es.onerror = () => {
    // If SSE fails (e.g., serverless env), fall back to polling
    es.close();
    startPolling();
  };

  return () => {
    stopped = true;
    try { es.close(); } catch {}
    if (pollId != null) { window.clearInterval(pollId); pollId = null; }
  };
}
