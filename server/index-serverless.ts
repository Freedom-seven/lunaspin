import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { ServerlessStore } from "./store-serverless";

export function createServerlessServer() {
  const app = express();
  const store = new ServerlessStore();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
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
    res.json({ type: "state", team, state });
  });

  app.post("/api/members/add", (req, res) => {
    const team = (req.query.team as string) || "default";
    const { name } = req.body as { name?: string };
    if (!name || !name.trim()) return res.status(400).json({ error: "name required" });
    const member = store.addMember(team, name.trim());
    const state = store.getTeam(team);
    res.json({ ok: true, member, state });
  });

  app.delete("/api/members/:id", (req, res) => {
    const team = (req.query.team as string) || "default";
    store.removeMember(team, req.params.id);
    const state = store.getTeam(team);
    res.json({ ok: true, state });
  });

  app.post("/api/members/:id/rename", (req, res) => {
    const team = (req.query.team as string) || "default";
    const { name } = req.body as { name?: string };
    store.renameMember(team, req.params.id, name ?? "");
    const state = store.getTeam(team);
    res.json({ ok: true, state });
  });

  app.post("/api/history/set-last-topic", (req, res) => {
    const team = (req.query.team as string) || "default";
    const { topic } = req.body as { topic?: string };
    const state = store.setTopicForLast(team, topic ?? "");
    res.json({ ok: true, state });
  });

  app.post("/api/history/update-topic", (req, res) => {
    const team = (req.query.team as string) || "default";
    const { index, topic } = req.body as { index: number; topic: string };
    const state = store.updateHistoryTopic(team, Number(index), topic ?? "");
    res.json({ ok: true, state });
  });

  app.delete("/api/history/:index", (req, res) => {
    const team = (req.query.team as string) || "default";
    const idx = Number(req.params.index);
    const state = store.deleteHistoryEntry(team, idx);
    res.json({ ok: true, state });
  });

  app.post("/api/reset", (req, res) => {
    const team = (req.query.team as string) || "default";
    const state = store.resetTeam(team);
    res.json({ ok: true, state });
  });

  // Spin start: server decides winner
  app.post("/api/spin/start", (req, res) => {
    const team = (req.query.team as string) || "default";
    const state = store.getTeam(team);
    
    if (!state.members || state.members.length < 2) {
      return res.status(400).json({ error: "need at least 2 members" });
    }

    const min = Math.min(...state.members.map((m) => m.spinsWon));
    const candidates = state.members
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.spinsWon === (isFinite(min) ? min : 0));
    
    const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? { 
      i: 0, 
      m: state.members[0] 
    };
    
    const segAngle = 360 / state.members.length;
    const index = pick.i;
    const winnerId = pick.m.id;
    const startedAt = Date.now();

    // Record win immediately with today's date
    const iso = new Date().toISOString().slice(0, 10);
    const newState = store.recordWin(team, winnerId, iso);

    const fullTurns = 50 + Math.floor(Math.random() * 20);

    const event = {
      type: "spin",
      team,
      payload: { 
        index, 
        winnerId, 
        startedAt, 
        durationMs: 20000, 
        fullTurns, 
        segAngle, 
        state: newState 
      },
    };

    res.json(event);
  });

  // SSE endpoint - NOT supported in Netlify Functions
  // Return error message instead
  app.get("/api/events", (_req, res) => {
    res.status(501).json({ 
      error: "Server-Sent Events not supported in serverless environment",
      message: "Please use polling or WebSocket alternative" 
    });
  });

  return app;
}
