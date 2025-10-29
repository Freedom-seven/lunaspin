import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { Store } from "./store";

export function createServer() {
  const app = express();
  const store = new Store();

  // Simple in-memory SSE client registry per team
  type Client = { id: string; team: string; send: (event: any) => void };
  const clients = new Map<string, Client>();

  function broadcast(team: string, event: any) {
    for (const c of clients.values()) if (c.team === team) c.send(event);
  }

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // SSE endpoint
  app.get("/api/events", (req, res) => {
    const team = (req.query.team as string) || "default";
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const id = Math.random().toString(36).slice(2);
    const send = (event: any) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const client: Client = { id, team, send };
    clients.set(id, client);

    // Send initial state snapshot
    const state = store.getTeam(team);
    send({ type: "state", team, state });

    req.on("close", () => {
      clients.delete(id);
    });
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // State APIs
  app.get("/api/state", (req, res) => {
    const team = (req.query.team as string) || "default";
    const state = store.getTeam(team);
    res.json({ team, state });
  });

  app.post("/api/team-name", (req, res) => {
    const team = (req.query.team as string) || "default";
    const { name } = req.body as { name?: string };
    const state = store.setTeamName(team, name ?? "");
    const ev = { type: "state", team, state };
    broadcast(team, ev);
    res.json(ev);
  });

  app.post("/api/members/add", (req, res) => {
    const team = (req.query.team as string) || "default";
    const { name } = req.body as { name?: string };
    if (!name || !name.trim()) return res.status(400).json({ error: "name required" });
    const member = store.addMember(team, name.trim());
    const state = store.getTeam(team);
    const ev = { type: "state", team, state };
    broadcast(team, ev);
    res.json({ ok: true, member });
  });

  app.delete("/api/members/:id", (req, res) => {
    const team = (req.query.team as string) || "default";
    store.removeMember(team, req.params.id);
    const state = store.getTeam(team);
    broadcast(team, { type: "state", team, state });
    res.json({ ok: true });
  });

  app.post("/api/members/:id/rename", (req, res) => {
    const team = (req.query.team as string) || "default";
    const { name } = req.body as { name?: string };
    store.renameMember(team, req.params.id, name ?? "");
    const state = store.getTeam(team);
    broadcast(team, { type: "state", team, state });
    res.json({ ok: true });
  });

  app.post("/api/history/set-last-topic", (req, res) => {
    const team = (req.query.team as string) || "default";
    const { topic } = req.body as { topic?: string };
    const state = store.setTopicForLast(team, topic ?? "");
    broadcast(team, { type: "state", team, state });
    res.json({ ok: true });
  });

  app.post("/api/history/update-topic", (req, res) => {
    const team = (req.query.team as string) || "default";
    const { index, topic } = req.body as { index: number; topic: string };
    const state = store.updateHistoryTopic(team, Number(index), topic ?? "");
    broadcast(team, { type: "state", team, state });
    res.json({ ok: true });
  });

  app.delete("/api/history/:index", (req, res) => {
    const team = (req.query.team as string) || "default";
    const idx = Number(req.params.index);
    const state = store.deleteHistoryEntry(team, idx);
    broadcast(team, { type: "state", team, state });
    res.json({ ok: true });
  });

  app.post("/api/reset", (req, res) => {
    const team = (req.query.team as string) || "default";
    const state = store.resetTeam(team);
    broadcast(team, { type: "state", team, state });
    res.json({ ok: true });
  });

  // Spin start: server decides winner and broadcasts spin + new state
  app.post("/api/spin/start", (req, res) => {
    const team = (req.query.team as string) || "default";
    const state = store.getTeam(team);
    if (!state.members || state.members.length < 2) return res.status(400).json({ error: "need at least 2 members" });

    const min = Math.min(...state.members.map((m) => m.spinsWon));
    const candidates = state.members
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.spinsWon === (isFinite(min) ? min : 0));
    const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? { i: 0, m: state.members[0] };
    const segAngle = 360 / state.members.length;
    const index = pick.i;
    const winnerId = pick.m.id;
    const centerAngle = index * segAngle + segAngle / 2;
    const fullTurns = 50 + Math.floor(Math.random() * 20);
    const startedAt = Date.now();

    // Record win immediately with today date
    const iso = new Date().toISOString().slice(0, 10);
    const newState = store.recordWin(team, winnerId, iso);

    const event = {
      type: "spin",
      team,
      payload: { index, winnerId, startedAt, durationMs: 20000, fullTurns, segAngle, state: newState },
    };
    broadcast(team, event);

    res.json(event);
  });

  return app;
}
