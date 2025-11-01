import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format } from "date-fns";

export interface Member {
  id: string;
  name: string;
  spinsWon: number;
  topics: string[];
}

export interface HistoryEntry {
  date: string; // ISO date
  winner: string; // member name snapshot
  topic?: string;
}

export interface SpinSession {
  index: number;
  winnerId: string;
  startedAt: number;
  durationMs: number;
  fullTurns: number;
  segAngle: number;
}

export interface LunaState {
  teamName: string;
  members: Member[];
  history: HistoryEntry[];
  // UI state
  lastWinnerId: string | null;
  // actions
  setTeamName: (name: string) => Promise<void> | void;
  addMember: (name: string) => Promise<void> | void;
  removeMember: (id: string) => Promise<void> | void;
  renameMember: (id: string, name: string) => Promise<void> | void;
  resetAll: () => void;
  clearLastWinner: () => void;
  recordWin: (memberId: string) => void; // kept for local fallback
  startSpin: () => Promise<void> | void;
  finalizeSpin: () => void; // set lastWinnerId and record after animation completes
  setTopicForWinner: (topic: string) => Promise<void> | void;
  updateHistoryTopic: (index: number, topic: string) => Promise<void> | void;
  deleteHistoryEntry: (index: number) => Promise<void> | void;
  hydrateFromServer: (state: Partial<LunaState>) => void;
  setSpinSession: (s: SpinSession | null) => void;
  spinSession: SpinSession | null;
  exportJSON: () => void;
  exportCSV: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function download(filename: string, text: string, mime = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

import { apiDelete, apiPost } from "@/lib/api";

export const useLuna = create<LunaState>()(
  persist(
    (set, get) => ({
      teamName: "",
      members: [],
      history: [],
      lastWinnerId: null,
      spinSession: null,

      setTeamName: async (name) => {
        set({ teamName: name });
        try { await apiPost("/api/team-name", { name }); } catch {}
      },

      addMember: async (name) => {
        set((s) => ({ members: [...s.members, { id: uid(), name: name.trim(), spinsWon: 0, topics: [] }] }));
        try { await apiPost("/api/members/add", { name }); } catch {}
      },

      removeMember: async (id) => {
        set((s) => ({ members: s.members.filter((m) => m.id !== id) }));
        try { await apiDelete(`/api/members/${id}`); } catch {}
      },

      renameMember: async (id, name) => {
        set((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, name } : m)) }));
        try { await apiPost(`/api/members/${id}/rename`, { name }); } catch {}
      },

      resetAll: async () => {
        set({ teamName: "", members: [], history: [], lastWinnerId: null, spinSession: null });
        try { await apiPost("/api/reset", {}); } catch {}
      },

      clearLastWinner: () => set({ lastWinnerId: null }),

      recordWin: (memberId) => {
        const state = get();
        const winner = state.members.find((m) => m.id === memberId);
        if (!winner) return;
        const updatedMembers = state.members.map((m) =>
          m.id === memberId ? { ...m, spinsWon: m.spinsWon + 1 } : m,
        );
        const entry: HistoryEntry = {
          date: format(new Date(), "yyyy-MM-dd"),
          winner: winner.name,
        };
        set({ members: updatedMembers, history: [entry, ...state.history], lastWinnerId: memberId });
      },

      setTopicForWinner: async (topic) => {
        // optimistic UI only; server is source of truth via SSE
        set((s) => {
          if (!s.lastWinnerId) return {} as Partial<LunaState>;
          const history = [...(s.history || [])];
          if (history.length > 0) history[0] = { ...history[0], topic };
          const members = s.members.map((m) => (m.id === s.lastWinnerId ? { ...m, topics: [...m.topics, topic] } : m));
          return { members, history };
        });
        try { await apiPost("/api/history/set-last-topic", { topic }); } catch {}
      },

      updateHistoryTopic: async (index, topic) => {
        set((s) => {
          const history = [...s.history];
          if (index >= 0 && index < history.length) history[index] = { ...history[index], topic };
          return { history };
        });
        try { await apiPost("/api/history/update-topic", { index, topic }); } catch {}
      },

      deleteHistoryEntry: async (index) => {
        set((s) => {
          const history = s.history.filter((_, i) => i !== index);
          return { history };
        });
        try { await apiDelete(`/api/history/${index}`); } catch {}
      },

      startSpin: async () => {
        const s = get();
        const members = s.members || [];
        if (members.length < 2) return;

        // Compute a fair pick locally so spin works even without backend events
        const min = Math.min(...members.map((m) => m.spinsWon));
        const candidates = members
          .map((m, i) => ({ m, i }))
          .filter(({ m }) => m.spinsWon === (isFinite(min) ? min : 0));
        const pick = candidates[Math.floor(Math.random() * Math.max(1, candidates.length))] || { i: 0, m: members[0] };

        const segAngle = 360 / members.length;
        const index = pick.i;
        const winnerId = pick.m.id;
        const fullTurns = 50 + Math.floor(Math.random() * 20);
        const startedAt = Date.now();
        const durationMs = 20000;

        // Set spin session only; do not set lastWinnerId or record until animation completes
        set({ spinSession: { index, winnerId, startedAt, durationMs, fullTurns, segAngle } });

        // Notify server best-effort (ignore failures)
        try { await apiPost("/api/spin/start", {}); } catch {}
      },

      hydrateFromServer: (remote) => set((s) => ({
        teamName: (remote.teamName && remote.teamName.length > 0) ? remote.teamName : s.teamName,
        members: (Array.isArray(remote.members) && remote.members.length > 0) ? remote.members : s.members,
        history: (Array.isArray(remote.history) && remote.history.length > 0) ? remote.history : s.history,
      })),

      setSpinSession: (spin) => set({ spinSession: spin }),

      finalizeSpin: () => {
        const s0 = get();
        const winnerId = s0.spinSession?.winnerId;
        if (!winnerId) return;
        // Record and reveal winner now
        get().recordWin(winnerId);
        set({ lastWinnerId: winnerId });
      },

      exportJSON: () => {
        const s = get();
        const payload = {
          teamName: s.teamName,
          members: s.members,
          history: s.history,
        };
        download(`lunaspin-${Date.now()}.json`, JSON.stringify(payload, null, 2));
      },

      exportCSV: () => {
        const s = get();
        const header = "date,winner,topic";
        const rows = s.history.map((h) =>
          [h.date, JSON.stringify(h.winner), JSON.stringify(h.topic ?? "")].join(","),
        );
        download(
          `lunaspin-history-${Date.now()}.csv`,
          [header, ...rows].join("\n"),
          "text/csv",
        );
      },
    }),
    {
      name: "lunaspin-store",
      version: 2,
      partialize: (s) => ({ teamName: s.teamName, members: s.members, history: s.history }),
    },
  ),
);
