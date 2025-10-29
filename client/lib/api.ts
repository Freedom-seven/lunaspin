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
  const es = new EventSource(`/api/events?team=${encodeURIComponent(team)}`);
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch {}
  };
  return () => es.close();
}