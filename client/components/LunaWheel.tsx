import React, { useMemo, useRef, useState } from "react";
import { motion as fmMotion, useAnimation } from "framer-motion";
import Confetti from "react-confetti";
import { useLuna } from "@/store/store";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";

interface LunaWheelProps {
  className?: string;
}

// Generate a simple chime using WebAudio to avoid large assets
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    const now = ctx.currentTime;
    o.frequency.setValueAtTime(880, now);
    o.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
    o.start(now);
    o.stop(now + 0.45);
  } catch {}
}

export const LunaWheel: React.FC<LunaWheelProps> = ({ className }) => {
  const { members, recordWin, clearLastWinner } = useLuna();
  const controls = useAnimation();
  const [spinning, setSpinning] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [confetti, setConfetti] = useState(false);
  const wheelRef = useRef<SVGSVGElement | null>(null);
  const [viewport, setViewport] = useState<{w:number;h:number}>({ w: 0, h: 0 });
  React.useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const colors = useMemo(() => {
    const base = [
      "#ef4444", // red
      "#f97316", // orange
      "#f59e0b", // amber
      "#84cc16", // lime
      "#22c55e", // green
      "#14b8a6", // teal
      "#3b82f6", // blue
      "#8b5cf6", // violet
      "#a855f7", // purple
      "#ec4899", // pink
    ];
    return (idx: number) => base[idx % base.length];
  }, []);

  const segAngle = members.length > 0 ? 360 / members.length : 0;

  const pickFairIndex = () => {
    // Fairness: pick among members with minimal spinsWon
    const min = Math.min(...members.map((m) => m.spinsWon));
    const candidates = members
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.spinsWon === (isFinite(min) ? min : 0));
    const chosen = candidates[Math.floor(Math.random() * candidates.length)]?.i ?? 0;
    return chosen;
  };

  function playWhoosh() {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 0.5;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const white = ctx.createBufferSource();
      white.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(4000, ctx.currentTime);
      white.connect(filter);
      const gain = ctx.createGain();
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.0001;
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      white.start();
      white.stop(ctx.currentTime + duration);
    } catch {}
  }

  const handleSpin = async () => {
    if (spinning || members.length === 0) return;
    const index = pickFairIndex();
    setWinnerIdx(index);
    setSpinning(true);
    setConfetti(false);
    playWhoosh();

    // Bring selected segment's center to the top (0deg). Pointer stays fixed at top.
    const centerAngle = index * segAngle + segAngle / 2;
    const fullTurns = 50 + Math.floor(Math.random() * 20); // fast, many rotations
    const targetRotation = fullTurns * 360 + (360 - centerAngle);

    // Spin for 20 seconds
    await controls.start({
      rotate: targetRotation,
      transition: { duration: 20, ease: [0.05, 0.8, 0.05, 1] },
    });

    // Winner announcement at 21s (+1s after stop)
    setTimeout(() => {
      const winner = members[index];
      recordWin(winner.id);
      setSpinning(false);
      setConfetti(true);
      playChime();
      // Full screen confetti for 20s
      setTimeout(() => setConfetti(false), 20000);
    }, 1000);
  };

  const resetWheel = () => {
    setWinnerIdx(null);
    setConfetti(false);
    controls.set({ rotate: 0 });
    clearLastWinner(); // Hide topic panel on home until next spin
  };

  const size = 520;
  const r = size / 2 - 40;
  const cx = size / 2;
  const cy = size / 2;

  const segments = useMemo(() => {
    const list: { path: string; fill: string; label: string; angle: number }[] = [];
    if (members.length === 0) return list;
    for (let i = 0; i < members.length; i++) {
      const start = (i * 2 * Math.PI) / members.length - Math.PI / 2; // start at top
      const end = ((i + 1) * 2 * Math.PI) / members.length - Math.PI / 2;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const largeArc = end - start <= Math.PI ? 0 : 1;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      const a = (i * 360) / members.length + segAngle / 2; // center angle in degrees (0 at top)
      list.push({ path, fill: colors(i), label: members[i].name, angle: a });
    }
    return list;
  }, [members, cx, cy, r, colors, segAngle]);

  return (
    <div className={className}>
      <div className="relative mx-auto w-[520px] h-[520px]">
        {confetti && typeof window !== "undefined" && (
          <Confetti
            numberOfPieces={1200}
            gravity={0.18}
            wind={0.002}
            recycle={false}
            width={viewport.w || undefined}
            height={viewport.h || undefined}
            className="pointer-events-none fixed inset-0"
          />
        )}
        <fmMotion.svg
          ref={wheelRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-[0_10px_25px_rgba(99,102,241,0.35)] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#171923] via-[#0f172a] to-[#0b1220]"
          animate={controls}
          role="img"
          aria-label="LunaSpin selection wheel"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="rim" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f4c14a" />
              <stop offset="70%" stopColor="#d9a526" />
              <stop offset="100%" stopColor="#a67810" />
            </radialGradient>
          </defs>
          {/* golden rim */}
          <circle cx={cx} cy={cy} r={r + 26} fill="#8b5e00" />
          <circle cx={cx} cy={cy} r={r + 26} fill="url(#rim)" />
          <circle cx={cx} cy={cy} r={r + 20} fill="#0f0e18" />

          {segments.map((seg, i) => (
            <g key={i}>
              <path d={seg.path} fill={seg.fill} opacity={0.95} />
            </g>
          ))}

          {/* studs */}
          {Array.from({ length: 16 }).map((_, i) => {
            const ang = (i / 16) * 2 * Math.PI - Math.PI / 2;
            const sx = cx + (r + 26) * Math.cos(ang);
            const sy = cy + (r + 26) * Math.sin(ang);
            return <circle key={`stud-${i}`} cx={sx} cy={sy} r={6} fill="#f5d04c" stroke="#b38400" strokeWidth={2} />;
          })}

          {/* labels */}
          {segments.map((seg, i) => {
            const a = (seg.angle - 90) * (Math.PI / 180);
            const lx = cx + (r * 0.65) * Math.cos(a);
            const ly = cy + (r * 0.65) * Math.sin(a);
            return (
              <text
                key={`label-${i}`}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: 14, fontWeight: 800, fill: "#F8FAFC", paintOrder: "stroke" }}
                stroke="#0b1220"
                strokeWidth={2}
                filter="url(#glow)"
              >
                {seg.label}
              </text>
            );
          })}
          {/* hub */}
          <circle cx={cx} cy={cy} r={26} fill="#0f0e18" stroke="#6366F1" strokeWidth={3} />
        </fmMotion.svg>
        {/* pointer */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2" aria-hidden>
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[36px] border-t-[#ef4444] drop-shadow-[0_10px_18px_rgba(239,68,68,0.55)]" />
        </div>
      </div>
      <div className="mt-16 flex items-center justify-center gap-3">
        <Button onClick={handleSpin} disabled={spinning || members.length < 2} className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_25px_rgba(99,102,241,0.45)] hover:shadow-[0_12px_28px_rgba(99,102,241,0.6)]">
          Spin
        </Button>
        <Button variant="outline" onClick={resetWheel} disabled={spinning} className="h-12 px-4 rounded-2xl">
          <RotateCw className="mr-2" /> Reset
        </Button>
      </div>
      {winnerIdx != null && !spinning && (
        <div className="mt-4 text-center text-lg font-bold text-white">
          Winner: <span className="text-secondary">{members[winnerIdx]?.name}</span>
        </div>
      )}
    </div>
  );
};

export default LunaWheel;
