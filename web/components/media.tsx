"use client";
// Media capture: mic button with old noteScreen recording UI (timer, waveform, tiger mascot),
// media picker tiles, chips, and audio players.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/legacy/icons";
import { Tiger } from "@/components/legacy/mascots";
import type { MediaType } from "@/lib/types";
import { cx } from "./ui";

export const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export type Recorded = { url: string; seconds: number };

/** Tap to record, tap to stop. Falls back to simulated audio if the mic is unavailable. */
export function MicButton({
  maxSeconds = 60,
  onDone,
  labels,
  size = "lg",
}: {
  maxSeconds?: number;
  onDone: (r: Recorded) => void;
  labels?: { idle: ReactNode; recording: ReactNode; hint?: ReactNode };
  size?: "lg" | "md";
}) {
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(20).fill(0.18));
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

      // Web Audio waveform
      const ctx = new AudioContext();
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      ctx.createMediaStreamSource(st).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteFrequencyData(buf);
        setLevels(Array.from({ length: 20 }, (_, i) => Math.max(0.15, (buf[i % buf.length] || 0) / 255)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {rec && big && (
        <div className="hello" style={{ padding: 0, minHeight: 0, marginBottom: 8 }}>
          <div className="m listen" style={{ width: 84, margin: "0 auto" }}>
            <span className="fl a"><Icon name="mic" /></span>
            <span className="fl b"><Icon name="book" /></span>
            <span className="fl c"><Icon name="heart" /></span>
            <Tiger mood="hi" />
          </div>
        </div>
      )}

      <button
        onClick={rec ? stop : start}
        aria-label={rec ? "Stop recording" : "Start recording"}
        className={cx("rb", rec ? "rec" : "send")}
        type="button"
        style={{
          width: big ? 76 : 52,
          height: big ? 76 : 52,
          fontSize: big ? 32 : 24,
          borderRadius: "50%",
        }}
      >
        <Icon name={rec ? "stop" : "mic"} />
      </button>

      {rec ? (
        <>
          <div className="timer">{fmtSecs(secs)}</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              height: 36,
              justifyContent: "center",
            }}
            aria-hidden
          >
            {levels.map((l, i) => (
              <span
                key={i}
                style={{
                  width: 4,
                  height: `${Math.round(l * 32)}px`,
                  borderRadius: 2,
                  background: "var(--pink)",
                  transition: "height 0.08s ease",
                }}
              />
            ))}
          </div>
          <div className="small" style={{ fontWeight: 600, color: "var(--pink)" }}>
            {labels?.recording ?? "Tap the pink button to finish"}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div className="h3">{labels?.idle ?? "Tap to record"}</div>
          {labels?.hint && <div className="small" style={{ marginTop: 2 }}>{labels.hint}</div>}
        </div>
      )}

      {note && (
        <p className="small" style={{ maxWidth: 280, textAlign: "center", color: "var(--mute)" }}>
          {note}
        </p>
      )}
    </div>
  );
}

const PICK_ICONS: Record<MediaType, string> = {
  voice: "mic",
  photo: "camera",
  video: "video",
  text: "type",
};

/** Four equal tiles: Voice, Photo, Video, Text. */
export function MediaPicker({
  onPick,
  labels,
  active,
  disabled = [],
}: {
  onPick: (t: MediaType) => void;
  labels?: Partial<Record<MediaType, ReactNode>>;
  active?: MediaType | null;
  disabled?: MediaType[];
}) {
  const def: Record<MediaType, string> = { voice: "Voice", photo: "Photo", video: "Video", text: "Text" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {(Object.keys(def) as MediaType[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onPick(t)}
          disabled={disabled.includes(t)}
          className={cx("tile", active === t && "is-pressed")}
          style={{
            padding: "10px 4px",
            border: active === t ? "1.5px solid var(--p)" : undefined,
          }}
        >
          <span className="ic" style={{ fontSize: 22, color: "var(--p)" }}>
            <Icon name={PICK_ICONS[t]} />
          </span>
          <span className="lab" style={{ marginTop: 4 }}>
            {labels?.[t] ?? def[t]}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Hidden file input helper for photo/video. */
export function useFilePicker(
  accept: string,
  onFile: (f: { url: string; name: string; seconds?: number }) => void,
  maxSeconds?: number,
) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const input = (
    <input
      ref={ref}
      type="file"
      accept={accept}
      capture={accept.startsWith("video") ? "environment" : undefined}
      hidden
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        const url = URL.createObjectURL(f);
        if (accept.startsWith("video") && maxSeconds) {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => {
            if (v.duration > maxSeconds + 0.5) {
              setError(`Please choose a video of ${maxSeconds} seconds or less.`);
            } else {
              setError(null);
              onFile({ url, name: f.name, seconds: Math.round(v.duration) });
            }
          };
          v.onerror = () => onFile({ url, name: f.name });
          v.src = url;
        } else {
          setError(null);
          onFile({ url, name: f.name });
        }
      }}
    />
  );

  return { open: () => ref.current?.click(), input, error };
}

export function MediaChip({
  type,
  label,
  onRemove,
  onPlay,
}: {
  type: MediaType;
  label: string;
  onRemove?: () => void;
  onPlay?: () => void;
}) {
  return (
    <span className="chipb" style={{ paddingLeft: 10, paddingRight: 6 }}>
      <span className="ic" style={{ width: 24, height: 24, fontSize: 13, color: "var(--p)" }}>
        <Icon name={PICK_ICONS[type]} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      {onPlay && (
        <button
          aria-label="Play"
          onClick={onPlay}
          className="xb"
          type="button"
          style={{ width: 26, height: 26, fontSize: 13, marginLeft: 4 }}
        >
          <Icon name="play" />
        </button>
      )}
      {onRemove && (
        <button
          aria-label="Remove"
          onClick={onRemove}
          className="xb"
          type="button"
          style={{ width: 26, height: 26, fontSize: 13, marginLeft: 4 }}
        >
          <Icon name="trash" />
        </button>
      )}
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
    <div className="card" style={{ padding: "8px 12px", margin: "6px 0", display: "flex", alignItems: "center", gap: 10 }}>
      <button
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => (playing ? a.current?.pause() : a.current?.play())}
        className="rb send"
        type="button"
        style={{ width: 34, height: 34, fontSize: 15 }}
      >
        <Icon name={playing ? "stop" : "play"} />
      </button>
      <div className="grow">
        <div className="small" style={{ fontWeight: 600, color: "var(--p)" }}>{label}</div>
        <div className="pbar" style={{ marginTop: 4, height: 6 }}>
          <i style={{ width: d ? `${(t / d) * 100}%` : "0%" }} />
        </div>
      </div>
      <span className="small" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtSecs(d ? d - t : 0)}</span>
      <audio
        ref={a}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setT(0);
        }}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setD(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
      />
    </div>
  );
}
