import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import express, { Request, Response } from "express";
import serverless from "serverless-http";
import { getStore } from "@netlify/blobs";

// Types
type Member = { id: string; name: string; spinsWon: number; topics: string[] };
type HistoryEntry = { date: string; winner: string; topic?: string };
type TeamState = { teamName: string; members: Member[]; history: HistoryEntry[] };

// Netlify Blobs store
const store = getStore("lunaspin");

// Helper functions for Blobs storage
async function getTeam(team: string): Promise<TeamState> {
  try {
    const data = await store.get(team, { type: "json" });
    if (data) {
      return data as TeamState;
    }
  } catch (error) {
    console.error("Error reading from Blobs:", error);
  }
  return { teamName: "", members: [], history: [] };
}

async function saveTeam(team: string, state: TeamState): Promise<void> {
  try {
    await store.setJSON(team, state);
  } catch (error) {
    console.error("Error saving to Blobs:", error);
  }
}

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get("/api/ping", (req: Request, res: Response) => {
  res.json({ message: "ping" });
});

// Get state
app.get("/api/state", async (req: Request, res: Response) => {
  const team = (req.query.team as string) || "default";
  const state = await getTeam(team);
  res.json({ team, state });
});

// SSE not supported - return error
app.get("/api/events", (req: Request, res: Response) => {
  res.status(501).json({ 
    error: "SSE not supported in serverless",
    message: "Use polling instead" 
  });
});

// Add member
app.post("/api/members/add", async (req: Request, res: Response) => {
  const team = (req.query.team as string) || "default";
  const { name } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "name required" });
  }
  
  const t = await getTeam(team);
  const id = Math.random().toString(36).slice(2, 10);
  const member: Member = { id, name: name.trim(), spinsWon: 0, topics: [] };
  t.members.push(member);
  await saveTeam(team, t);
  
  res.json({ ok: true, member, state: t });
});

// Remove member
app.delete("/api/members/:id", async (req: Request, res: Response) => {
  const team = (req.query.team as string) || "default";
  const t = await getTeam(team);
  t.members = t.members.filter((m) => m.id !== req.params.id);
  await saveTeam(team, t);
  res.json({ ok: true, state: t });
});

// Rename member
app.post("/api/members/:id/rename", async (req: Request, res: Response) => {
  const team = (req.query.team as string) || "default";
  const { name } = req.body;
  const t = await getTeam(team);
  t.members = t.members.map((m) => (m.id === req.params.id ? { ...m, name } : m));
  await saveTeam(team, t);
  res.json({ ok: true, state: t });
});

// Set team name
app.post("/api/team-name", async (req: Request, res: Response) => {
  const team = (req.query.team as string) || "default";
  const { name } = req.body;
  const t = await getTeam(team);
  t.teamName = name ?? "";
  await saveTeam(team, t);
  res.json({ type: "state", team, state: t });
});

// Reset team
app.post("/api/reset", async (req: Request, res: Response) => {
  const team = (req.query.team as string) || "default";
  const emptyState = { teamName: "", members: [], history: [] };
  await saveTeam(team, emptyState);
  res.json({ ok: true, state: emptyState });
});

// Spin start
app.post("/api/spin/start", async (req: Request, res: Response) => {
  const team = (req.query.team as string) || "default";
  const state = await getTeam(team);
  
  if (!state.members || state.members.length < 2) {
    return res.status(400).json({ error: "need at least 2 members" });
  }
  
  const min = Math.min(...state.members.map((m) => m.spinsWon));
  const candidates = state.members
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.spinsWon === (isFinite(min) ? min : 0));
  
  const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? {
    i: 0,
    m: state.members[0],
  };
  
  const segAngle = 360 / state.members.length;
  const index = pick.i;
  const winnerId = pick.m.id;
  const startedAt = Date.now();
  const fullTurns = 50 + Math.floor(Math.random() * 20);
  
  // Record win
  const winner = state.members.find((m) => m.id === winnerId);
  if (winner) {
    state.members = state.members.map((m) =>
      m.id === winnerId ? { ...m, spinsWon: m.spinsWon + 1 } : m
    );
    const iso = new Date().toISOString().slice(0, 10);
    state.history = [{ date: iso, winner: winner.name }, ...state.history];
  }
  
  // Save updated state to Blobs
  await saveTeam(team, state);
  
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
      state,
    },
  };
  
  res.json(event);
});

// History endpoints
app.post("/api/history/set-last-topic", async (req: Request, res: Response) => {
  const team = (req.query.team as string) || "default";
  const { topic } = req.body;
  const t = await getTeam(team);
  
  if (t.history.length > 0) {
    t.history[0] = { ...t.history[0], topic };
  }
  
  await saveTeam(team, t);
  res.json({ ok: true, state: t });
});

app.post("/api/history/update-topic", async (req: Request, res: Response) => {
  const team = (req.query.team as string) || "default";
  const { index, topic } = req.body;
  const t = await getTeam(team);
  
  if (index >= 0 && index < t.history.length) {
    t.history[index] = { ...t.history[index], topic };
  }
  
  await saveTeam(team, t);
  res.json({ ok: true, state: t });
});

app.delete("/api/history/:index", async (req: Request, res: Response) => {
  const team = (req.query.team as string) || "default";
  const idx = Number(req.params.index);
  const t = await getTeam(team);
  t.history = t.history.filter((_, i) => i !== idx);
  await saveTeam(team, t);
  res.json({ ok: true, state: t });
});

// Export handler
export const handler = serverless(app);
