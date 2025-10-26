import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pause, Play, RotateCw } from "lucide-react";

export default function HuddleTimer() {
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState(5);
  const [remaining, setRemaining] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setRemaining((s) => Math.max(0, s - 1));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (remaining === 0) setRunning(false);
  }, [remaining]);

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = useMemo(() => remaining / (minutes * 60), [remaining, minutes]);
  const dash = circumference * progress;

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setRemaining(minutes * 60);
  };

  const applyMinutes = (m: number) => {
    const v = Math.max(1, Math.min(60, Math.floor(m)));
    setMinutes(v);
    setRemaining(v * 60);
  };

  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="rounded-xl">Start Huddle</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Micro‑Huddle Timer</DialogTitle>
          <DialogDescription>Run a quick, focused huddle. Set time, then start.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center">
          <svg width={300} height={300} viewBox="0 0 300 300" className="mb-4">
            <circle cx={150} cy={150} r={radius} stroke="#1f2937" strokeWidth={14} fill="none" />
            <circle
              cx={150}
              cy={150}
              r={radius}
              stroke="hsl(var(--primary))"
              strokeWidth={14}
              fill="none"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 150 150)"
            />
            <text x="150" y="160" textAnchor="middle" fontSize="40" fontWeight="800" fill="white">{m}:{s}</text>
          </svg>
          <div className="flex items-center gap-3">
            <Button onClick={start} disabled={running} className="rounded-xl"><Play className="mr-2"/>Start</Button>
            <Button onClick={pause} variant="outline" disabled={!running} className="rounded-xl"><Pause className="mr-2"/>Pause</Button>
            <Button onClick={reset} variant="outline" className="rounded-xl"><RotateCw className="mr-2"/>Reset</Button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <label className="text-sm text-white/80">Minutes</label>
            <Input type="number" min={1} max={60} value={minutes} onChange={(e)=> applyMinutes(Number(e.target.value))} className="w-24 rounded-xl" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={()=> setOpen(false)} className="rounded-xl">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
