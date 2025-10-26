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

export interface LunaState {
  teamName: string;
  members: Member[];
  history: HistoryEntry[];
  // UI state
  lastWinnerId: string | null;
  // actions
  setTeamName: (name: string) => void;
  addMember: (name: string) => void;
  removeMember: (id: string) => void;
  renameMember: (id: string, name: string) => void;
  resetAll: () => void;
  clearLastWinner: () => void;
  recordWin: (memberId: string) => void;
  setTopicForWinner: (topic: string) => void;
  updateHistoryTopic: (index: number, topic: string) => void;
  deleteHistoryEntry: (index: number) => void;
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

export const useLuna = create<LunaState>()(
  persist(
    (set, get) => ({
      teamName: "",
      members: [],
      history: [],
      lastWinnerId: null,

      setTeamName: (name) => set({ teamName: name }),

      addMember: (name) =>
        set((s) => ({
          members: [...s.members, { id: uid(), name: name.trim(), spinsWon: 0, topics: [] }],
        })),

      removeMember: (id) =>
        set((s) => ({ members: s.members.filter((m) => m.id !== id) })),

      renameMember: (id, name) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, name } : m)),
        })),

      resetAll: () => set({ teamName: "", members: [], history: [], lastWinnerId: null }),

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

      setTopicForWinner: (topic) =>
        set((s) => {
          if (!s.lastWinnerId) return {} as Partial<LunaState>;
          const history = [...s.history];
          if (history.length > 0) history[0] = { ...history[0], topic };
          const members = s.members.map((m) =>
            m.id === s.lastWinnerId ? { ...m, topics: [...m.topics, topic] } : m,
          );
          return { members, history };
        }),

      updateHistoryTopic: (index, topic) =>
        set((s) => {
          const history = [...s.history];
          if (index >= 0 && index < history.length) history[index] = { ...history[index], topic };
          return { history };
        }),

      deleteHistoryEntry: (index) =>
        set((s) => {
          const history = s.history.filter((_, i) => i !== index);
          return { history };
        }),

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
      version: 1,
      partialize: (s) => ({ teamName: s.teamName, members: s.members, history: s.history }),
    },
  ),
);
