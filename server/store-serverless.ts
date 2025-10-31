/**
 * Serverless-compatible store for Netlify Functions
 * 
 * This version stores data in memory only and uses environment variables
 * for persistent storage across function invocations via a KV store
 * or external database.
 * 
 * For production, you should use:
 * - Netlify Blobs: https://docs.netlify.com/blobs/overview/
 * - External DB: MongoDB, PostgreSQL, etc.
 * - Redis for caching
 */

export type Member = { id: string; name: string; spinsWon: number; topics: string[] };
export type HistoryEntry = { date: string; winner: string; topic?: string };
export type TeamState = { teamName: string; members: Member[]; history: HistoryEntry[] };
export type DB = { teams: Record<string, TeamState> };

// In-memory store (will reset on each cold start)
let memoryDB: DB = { teams: {} };

export class ServerlessStore {
  private db: DB;

  constructor() {
    // Initialize with in-memory storage
    this.db = memoryDB;
  }

  getTeam(team: string): TeamState {
    if (!this.db.teams[team]) {
      this.db.teams[team] = { teamName: "", members: [], history: [] };
    }
    return this.db.teams[team];
  }

  setTeamName(team: string, name: string): TeamState {
    const t = this.getTeam(team);
    t.teamName = name;
    return t;
  }

  addMember(team: string, name: string) {
    const t = this.getTeam(team);
    const id = Math.random().toString(36).slice(2, 10);
    const m: Member = { id, name: name.trim(), spinsWon: 0, topics: [] };
    t.members.push(m);
    return m;
  }

  removeMember(team: string, id: string) {
    const t = this.getTeam(team);
    t.members = t.members.filter((m) => m.id !== id);
    return t;
  }

  renameMember(team: string, id: string, name: string) {
    const t = this.getTeam(team);
    t.members = t.members.map((m) => (m.id === id ? { ...m, name } : m));
    return t;
  }

  resetTeam(team: string) {
    this.db.teams[team] = { teamName: "", members: [], history: [] };
    return this.db.teams[team];
  }

  recordWin(team: string, memberId: string, dateISO: string, topic?: string) {
    const t = this.getTeam(team);
    const winner = t.members.find((m) => m.id === memberId);
    if (!winner) return t;
    t.members = t.members.map((m) => (m.id === memberId ? { ...m, spinsWon: m.spinsWon + 1 } : m));
    t.history = [{ date: dateISO, winner: winner.name, topic }, ...t.history];
    return t;
  }

  setTopicForLast(team: string, topic: string) {
    const t = this.getTeam(team);
    if (t.history.length > 0) {
      t.history[0] = { ...t.history[0], topic };
      const lastWinnerName = t.history[0].winner;
      t.members = t.members.map((m) => (m.name === lastWinnerName ? { ...m, topics: [...m.topics, topic] } : m));
    }
    return t;
  }

  updateHistoryTopic(team: string, index: number, topic: string) {
    const t = this.getTeam(team);
    if (index >= 0 && index < t.history.length) {
      t.history[index] = { ...t.history[index], topic };
    }
    return t;
  }

  deleteHistoryEntry(team: string, index: number) {
    const t = this.getTeam(team);
    t.history = t.history.filter((_, i) => i !== index);
    return t;
  }
}
