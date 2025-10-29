import { useMemo } from "react";
import { QOTD_DATA } from "../../qotdData";

function getQuestionOfTheDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Use the day of the year (0-364) to select a question, ensuring it's unique for each day.
  const index = dayOfYear % QOTD_DATA.length;
  return QOTD_DATA[index];
}

export default function DailyHuddle() {
  const { question, tip } = useMemo(() => getQuestionOfTheDay(), []);

  return (
    <div className="rounded-2xl p-5 bg-white/5 border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-secondary">Daily Huddle</div>
          <h3 className="mt-1 text-xl font-extrabold text-white">Question of the Day</h3>
        </div>
      </div>
      <p className="mt-3 text-lg text-white/90">{question}</p>
      <p className="mt-2 text-sm text-white/70">{tip}</p>
    </div>
  );
}
