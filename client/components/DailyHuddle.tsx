import { useMemo } from "react";

// Build a conversational pool of at least 365 prompts without repeats
function buildPromptPool(): string[] {
  const base: string[] = [
    "What's one small win from this week?",
    "What energized you at work recently?",
    "What's a habit that helps you start your day?",
    "Who's someone you'd like to thank this week and why?",
    "What is one thing you're looking forward to today?",
    "What made a meeting great for you lately?",
    "What's your go-to way to recharge during the day?",
    "Share a non-work skill you're improving right now.",
    "What's a book, show, or podcast you'd recommend?",
    "What's a value you saw in action on our team?",
    "What's a recent challenge that taught you something?",
    "If you had an extra hour today, how would you use it?",
    "What's your favorite way to celebrate small wins?",
    "What's a conversation you'd like us to have more often?",
  ];

  const openers = [
    "What's",
    "Share",
    "Tell us about",
    "Name",
    "In one sentence, what's",
    "Describe",
  ];
  const subjects = [
    "a small win from this week",
    "a moment you appreciated a teammate",
    "a habit that helps you focus",
    "one thing you'd like to try this month",
    "a way you reduce stress during the day",
    "a lesson from a recent hiccup",
    "a boundary that protects your focus",
    "a time you felt proud of our team",
    "a tool or shortcut that saves you time",
    "a ritual that starts your day well",
    "a value you saw in action recently",
    "a conversation you think we should have",
    "a practice that helps you learn fast",
    "a thing that made collaboration easier",
    "a question you'd love to ask a mentor",
  ];
  const frames = [
    "today",
    "this week",
    "recently",
    "this month",
  ];

  const set = new Set<string>(base);
  for (const a of openers) {
    for (const b of subjects) {
      for (const c of frames) {
        const q = `${a} ${b} ${c}?`.
          replace(/\s+/g, " ").
          replace(/\?\?$/, "?");
        set.add(q);
      }
    }
  }
  // If still short of 365, add variations
  const variants = [
    "What's something you're curious about right now?",
    "What's one thing that would make today smoother?",
    "What's a recent 'aha' moment at work?",
    "How do you like to recharge between tasks?",
    "What helps you switch off after work?",
    "What's a tiny experiment you'd run this week?",
    "Which teammate inspired you and how?",
    "What's a topic you'd enjoy presenting on?",
    "What's a small habit that makes a big difference?",
  ];
  for (const v of variants) set.add(v);

  const list = Array.from(set);
  // Ensure at least 365 by duplicating structure with synonyms safely
  const synonyms = ["share", "name", "describe", "talk about", "highlight"];
  let i = 0;
  while (list.length < 365 && i < 2000) {
    const subj = subjects[i % subjects.length];
    const syn = synonyms[i % synonyms.length];
    const frm = frames[(i * 7) % frames.length];
    const q = `${syn.charAt(0).toUpperCase() + syn.slice(1)} ${subj} ${frm}?`;
    if (!set.has(q)) {
      set.add(q);
      list.push(q);
    }
    i++;
  }
  return list.slice(0, 365);
}

const PROMPTS = buildPromptPool();

function seededIndex(seed: string, max: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % max;
}

export default function DailyHuddle() {
  const today = new Date().toISOString().slice(0, 10);
  const prompt = useMemo(() => PROMPTS[seededIndex(today, PROMPTS.length)], [today]);

  const TIP_PATTERNS = [
    "Tip: Keep it brief - one sentence each, then one follow-up.",
    "Tip: Offer one example; drop links in chat after.",
    "Tip: Go around quickly, then free-form for two minutes.",
    "Tip: Celebrate small wins - reactions welcome.",
    "Tip: One idea per person - clarity over detail.",
    "Tip: If you mention a tool, share one shortcut.",
    "Tip: Prefer stories over status - keep it human.",
    "Tip: Use names - appreciate one teammate today.",
    "Tip: End with one takeaway from the group.",
    "Tip: Pause after each share for a quick reaction.",
  ];

  const advice = useMemo(() => {
    const q = prompt.toLowerCase();
    if (q.includes("learn") || q.includes("new")) return "Tip: Keep it brief - one sentence each, then one follow-up.";
    if (q.includes("music") || q.includes("song")) return "Tip: Share a short clip or just the title - no autoplay.";
    if (q.includes("productivity") || q.includes("hack")) return "Tip: Demo the hack in 20 seconds and share notes after.";
    if (q.includes("thank") || q.includes("appreciate")) return "Tip: Say the name, the action, and why it mattered.";
    const idx = seededIndex(prompt, TIP_PATTERNS.length);
    return TIP_PATTERNS[idx];
  }, [prompt]);

  return (
    <div className="rounded-2xl p-5 bg-white/5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-secondary">Daily Huddle</div>
          <h3 className="mt-1 text-xl font-extrabold text-white">Question of the Day</h3>
        </div>
      </div>
      <p className="mt-3 text-lg text-white/90">{prompt}</p>
      <p className="mt-2 text-sm text-white/70">{advice}</p>
    </div>
  );
}
