"use client";
// Media capture: mic button (timer, waveform, time cap), media picker tiles, media chips and players.
import { Camera, FileText, Mic, Pause, Play, Square, Trash2, Video } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { MediaType } from "@/lib/types";
import { cx } from "./ui";

export const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export type Recorded = { url: string; seconds: number };

/** Tap to record, tap to stop. Falls back to a simulated recording if the mic is unavailable. */
export function MicButton({ maxSeconds = 60, onDone, labels, size = "lg" }: {
  maxSeconds?: number;
  onDone: (r: Recorded) => void;
  labels?: { idle: ReactNode; recording: ReactNode; hint?: ReactNode };
  size?: "lg" | "md";
}) {
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(24).fill(0.15));
  const [note, setNote] = useState<string | null>(null);
  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);
  const started = useRef(0);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef<number | null>(null);
  const simulated = useRef(false);

  const cleanup = () => {
    if (timer.current) window.clearInterval(timer.current);
    if (raf.current) cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => cleanup, []);

  const stop = () => {
    const s = Math.max(1, Math.round((Date.now() - started.current) / 1000));
    setRec(false);
    if (simulated.current) {
      cleanup();
      onDone({ url: "/demo/voice-1.wav", seconds: s });
      return;
    }
    if (mr.current && mr.current.state !== "inactive") mr.current.stop();
  };

  const start = async () => {
    setNote(null);
    setSecs(0);
    chunks.current = [];
    started.current = Date.now();
    simulated.current = false;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("no mic");
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = st;
      const m = new MediaRecorder(st);
      m.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      m.onstop = () => {
        const s = Math.max(1, Math.round((Date.now() - started.current) / 1000));
        const blob = new Blob(chunks.current, { type: m.mimeType || "audio/webm" });
        cleanup();
        onDone({ url: URL.createObjectURL(blob), seconds: s });
      };
      m.start();
      mr.current = m;
      // waveform
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      ctx.createMediaStreamSource(st).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteFrequencyData(buf);
        setLevels(Array.from({ length: 24 }, (_, i) => Math.max(0.12, (buf[i % buf.length] || 0) / 255)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // No microphone (or permission denied, or http on a phone): simulate so the demo still flows.
      simulated.current = true;
      setNote("Microphone not available — recording a sample note for the demo.");
      const tick = () => {
        setLevels((l) => l.map(() => 0.15 + Math.random() * 0.7));
        raf.current = requestAnimationFrame(() => window.setTimeout(tick, 90));
      };
      tick();
    }
    setRec(true);
    timer.current = window.setInterval(() => {
      const s = (Date.now() - started.current) / 1000;
      setSecs(s);
      if (s >= maxSeconds) stop();
    }, 200);
  };

  const big = size === "lg";
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={rec ? stop : start}
        aria-label={rec ? "Stop recording" : "Start recording"}
        className={cx("relative grid place-items-center rounded-full text-white transition active:scale-95", big ? "size-24" : "size-16",
          rec ? "bg-[#ff9500] shadow-[0_0_0_10px_rgba(255,149,0,.18)]" : "bg-primary shadow-[0_12px_28px_-10px_var(--primary)]")}
      >
        {rec ? <Square className={big ? "size-9" : "size-6"} fill="currentColor" /> : <Mic className={big ? "size-10" : "size-7"} />}
      </button>
      {rec ? (
        <>
          <div className="flex h-10 items-center gap-[3px]" aria-hidden>
            {levels.map((l, i) => <span key={i} className="w-[4px] rounded-full bg-[#ff9500]" style={{ height: `${Math.round(l * 40)}px` }} />)}
          </div>
          <div className="text-2xl font-bold tabular-nums">{fmtSecs(secs)} <span className="text-sm font-medium text-muted">/ {fmtSecs(maxSeconds)}</span></div>
          <div className="text-sm font-semibold">{labels?.recording ?? "Tap to stop"}</div>
        </>
      ) : (
        <div className="text-center">
          <div className="text-[15px] font-semibold">{labels?.idle ?? "Tap to record"}</div>
          {labels?.hint && <div className="mt-0.5 text-xs text-muted">{labels.hint}</div>}
        </div>
      )}
      {note && <div className="max-w-xs text-center text-xs text-muted">{note}</div>}
    </div>
  );
}

const PICK_ICONS: Record<MediaType, ReactNode> = {
  voice: <Mic className="size-7" />, photo: <Camera className="size-7" />, video: <Video className="size-7" />, text: <FileText className="size-7" />,
};

/** Four equal tiles: Voice, Photo, Video, Text. */
export function MediaPicker({ onPick, labels, active, disabled = [] }: {
  onPick: (t: MediaType) => void;
  labels?: Partial<Record<MediaType, ReactNode>>;
  active?: MediaType | null;
  disabled?: MediaType[];
}) {
  const def: Record<MediaType, string> = { voice: "Voice", photo: "Photo", video: "Video", text: "Text" };
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {(Object.keys(def) as MediaType[]).map((t) => (
        <button key={t} onClick={() => onPick(t)} disabled={disabled.includes(t)}
          className={cx("glass flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl text-primary transition active:scale-95 disabled:opacity-40",
            active === t && "ring-3 ring-primary bg-primary-soft")}>
          {PICK_ICONS[t]}
          <span className="text-[13px] font-semibold text-text">{labels?.[t] ?? def[t]}</span>
        </button>
      ))}
    </div>
  );
}

/** Hidden file input helper for photo/video. */
export function useFilePicker(accept: string, onFile: (f: { url: string; name: string; seconds?: number }) => void, maxSeconds?: number) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = (
    <input ref={ref} type="file" accept={accept} capture={accept.startsWith("video") ? "environment" : undefined} hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        const url = URL.createObjectURL(f);
        if (accept.startsWith("video") && maxSeconds) {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => {
            if (v.duration > maxSeconds + 0.5) setError(`Please choose a video of ${maxSeconds} seconds or less.`);
            else { setError(null); onFile({ url, name: f.name, seconds: Math.round(v.duration) }); }
          };
          v.onerror = () => onFile({ url, name: f.name });
          v.src = url;
        } else {
          setError(null);
          onFile({ url, name: f.name });
        }
      }} />
  );
  return { open: () => ref.current?.click(), input, error };
}

export function MediaChip({ type, label, onRemove, onPlay }: { type: MediaType; label: string; onRemove?: () => void; onPlay?: () => void }) {
  const icons: Record<MediaType, ReactNode> = { voice: <Mic className="size-4" />, photo: <Camera className="size-4" />, video: <Video className="size-4" />, text: <FileText className="size-4" /> };
  return (
    <span className="glass inline-flex min-h-11 items-center gap-2 rounded-full pl-3.5 pr-1 text-sm font-semibold">
      <span className="text-primary">{icons[type]}</span>{label}
      {onPlay && <button aria-label="Play" onClick={onPlay} className="grid size-9 place-items-center rounded-full hover:bg-primary-soft"><Play className="size-4" /></button>}
      {onRemove && <button aria-label="Remove" onClick={onRemove} className="grid size-9 place-items-center rounded-full text-muted hover:bg-primary-soft"><Trash2 className="size-4" /></button>}
    </span>
  );
}

export function AudioPlayer({ src, label = "Voice note" }: { src?: string; label?: string }) {
  const a = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [d, setD] = useState(0);
  if (!src) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-primary-soft px-2 py-1.5">
      <button aria-label={playing ? "Pause" : "Play"} onClick={() => (playing ? a.current?.pause() : a.current?.play())}
        className="grid size-10 place-items-center rounded-full bg-primary text-white">
        {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="size-4 translate-x-[1px]" fill="currentColor" />}
      </button>
      <div className="flex-1">
        <div className="text-xs font-semibold text-primary">{label}</div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/60"><div className="h-full bg-primary" style={{ width: d ? `${(t / d) * 100}%` : "0%" }} /></div>
      </div>
      <span className="pr-2 text-xs tabular-nums text-text-2">{fmtSecs(d ? d - t : 0)}</span>
      <audio ref={a} src={src} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setT(0); }}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setD(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)} />
    </div>
  );
}
