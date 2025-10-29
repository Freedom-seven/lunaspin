import fs from "fs";
import path from "path";

export type Member = { id: string; name: string; spinsWon: number; topics: string[] };
export type HistoryEntry = { date: string; winner: string; topic?: string };
export type TeamState = { teamName: string; members: Member[]; history: HistoryEntry[] };
export type DB = { teams: Record<string, TeamState> };

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "lunaspin.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readFile(): DB {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const db = JSON.parse(raw) as DB;
    if (!db.teams) return { teams: {} };
    return db;
  } catch {
    return { teams: {} };
  }
}

function writeFile(db: DB) {
  ensureDir();
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tmp, DATA_FILE);
}

export class Store {
  private db: DB;
  constructor() {
    ensureDir();
    this.db = readFile();
  }

  getTeam(team: string): TeamState {
    if (!this.db.teams[team]) {
      this.db.teams[team] = { teamName: "", members: [], history: [] };
      writeFile(this.db);
    }
    return this.db.teams[team];
  }

  setTeamName(team: string, name: string): TeamState {
    const t = this.getTeam(team);
    t.teamName = name;
    writeFile(this.db);
    return t;
  }

  addMember(team: string, name: string) {
    const t = this.getTeam(team);
    const id = Math.random().toString(36).slice(2, 10);
    const m: Member = { id, name: name.trim(), spinsWon: 0, topics: [] };
    t.members.push(m);
    writeFile(this.db);
    return m;
  }

  removeMember(team: string, id: string) {
    const t = this.getTeam(team);
    t.members = t.members.filter((m) => m.id !== id);
    writeFile(this.db);
    return t;
  }

  renameMember(team: string, id: string, name: string) {
    const t = this.getTeam(team);
    t.members = t.members.map((m) => (m.id === id ? { ...m, name } : m));
    writeFile(this.db);
    return t;
  }

  resetTeam(team: string) {
    this.db.teams[team] = { teamName: "", members: [], history: [] };
    writeFile(this.db);
    return this.db.teams[team];
  }

  recordWin(team: string, memberId: string, dateISO: string, topic?: string) {
    const t = this.getTeam(team);
    const winner = t.members.find((m) => m.id === memberId);
    if (!winner) return t;
    t.members = t.members.map((m) => (m.id === memberId ? { ...m, spinsWon: m.spinsWon + 1 } : m));
    t.history = [{ date: dateISO, winner: winner.name, topic }, ...t.history];
    writeFile(this.db);
    return t;
  }

  setTopicForLast(team: string, topic: string) {
    const t = this.getTeam(team);
    if (t.history.length > 0) {
      t.history[0] = { ...t.history[0], topic };
      const lastWinnerName = t.history[0].winner;
      // Also add topic to member if still exists
      t.members = t.members.map((m) => (m.name === lastWinnerName ? { ...m, topics: [...m.topics, topic] } : m));
      writeFile(this.db);
    }
    return t;
  }

  updateHistoryTopic(team: string, index: number, topic: string) {
    const t = this.getTeam(team);
    if (index >= 0 && index < t.history.length) {
      t.history[index] = { ...t.history[index], topic };
      writeFile(this.db);
    }
    return t;
  }

  deleteHistoryEntry(team: string, index: number) {
    const t = this.getTeam(team);
    t.history = t.history.filter((_, i) => i !== index);
    writeFile(this.db);
    return t;
  }
}