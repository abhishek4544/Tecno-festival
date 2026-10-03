'use client';

<<<<<<< Updated upstream
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';

=======
import { useEffect, useRef, useState, type PointerEvent } from 'react';
>>>>>>> Stashed changes
import { cn } from '@/lib/utils';
import {
  ScratchSurface,
  SCRATCH_REVEAL_THRESHOLD,
} from '@/lib/scratch-surface';

<<<<<<< Updated upstream
const BRUSH_RADIUS = 22;
// The rest of the cover fades away after 1–3 scratches: as soon as the total
// scratched distance reaches this many card-widths (one long zig-zag, or two
// swipes across), or after the maximum number of scratches regardless.
// Strokes shorter than the minimum (taps, accidental touches) don't count.
const REVEAL_DISTANCE_IN_CARD_WIDTHS = 1.5;
const MAX_SCRATCHES_TO_REVEAL = 3;
const MIN_SCRATCH_LENGTH = 40;

// Mirrors `.bg-scratch-card` and the "Tecno" watermark in the design.
const COVER_GRADIENT_ANGLE = 229.23;
const COVER_GRADIENT_STOPS = [
  ['--color-white', '#ffffff', 0.0419],
  ['--color-neutral-150', '#f2f2f2', 0.3361],
  ['--color-white', '#ffffff', 0.6595],
  ['--color-neutral-150', '#f2f2f2', 1],
] as const;
const WATERMARK_ROWS = 9;
const WATERMARK_WORDS_PER_ROW = 12;
const WATERMARK_WORD_GAP = 13.807;
const WATERMARK_ROW_PITCH = 34.944;
const WATERMARK_ROW_WIDTH = 545.37;
const WATERMARK_ROW_INDENT = 27.614;
// Rows the design shifts right by the indent (not strictly alternating).
const WATERMARK_INDENTED_ROWS = [0, 2, 4, 7];
const WATERMARK_ROTATION = (-40.77 * Math.PI) / 180;
const COVER_PROMPT = ['Scratch the card,', 'to view your prize.'];
const COVER_PROMPT_LINE_HEIGHT = 17.6;

// The design layers a warm grain over the gradient (a Figma noise effect,
// which isn't exported as code). Each CSS pixel gets a random amount of this
// colour, matching the strength and tint measured from the design's render.
const GRAIN_COLOR = [242, 204, 0] as const;
const GRAIN_MIN_ALPHA = 0.02;
const GRAIN_MAX_ALPHA = 0.16;
// The revealed result carries a lighter version of the same grain.
const PRIZE_GRAIN_STRENGTH = 0.6;

type ScratchCardProps = {
  className?: string;
  onReveal?: () => void;
  // What sits under the cover, e.g. the prize the entry won.
  children: ReactNode;
};

function sizeCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function drawGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength = 1,
) {
  const grain = document.createElement('canvas');
  grain.width = Math.ceil(width);
  grain.height = Math.ceil(height);
  const grainCtx = grain.getContext('2d');
  if (!grainCtx) return;

  const pixels = grainCtx.createImageData(grain.width, grain.height);
  const [r, g, b] = GRAIN_COLOR;
  for (let i = 0; i < pixels.data.length; i += 4) {
    const alpha =
      strength *
      (GRAIN_MIN_ALPHA + Math.random() * (GRAIN_MAX_ALPHA - GRAIN_MIN_ALPHA));
    pixels.data[i] = r;
    pixels.data[i + 1] = g;
    pixels.data[i + 2] = b;
    pixels.data[i + 3] = Math.round(alpha * 255);
  }
  grainCtx.putImageData(pixels, 0, 0);

  // Scaled up without smoothing so each speck stays one CSS pixel on
  // high-density screens, like the design.
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(grain, 0, 0, grain.width, grain.height);
  ctx.restore();
}

function drawCover(canvas: HTMLCanvasElement, width: number, height: number) {
  const ctx = sizeCanvas(canvas, width, height);
  if (!ctx) return;

  // CSS gradient angles start at "to top" and turn clockwise.
  const angle = (COVER_GRADIENT_ANGLE * Math.PI) / 180;
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  const half =
    (Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle))) /
    2;
  const gradient = ctx.createLinearGradient(
    width / 2 - dx * half,
    height / 2 - dy * half,
    width / 2 + dx * half,
    height / 2 + dy * half,
  );
  const styles = getComputedStyle(canvas);
  COVER_GRADIENT_STOPS.forEach(([token, fallback, offset]) => {
    gradient.addColorStop(
      offset,
      styles.getPropertyValue(token).trim() || fallback,
    );
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  drawGrain(ctx, width, height);

  ctx.save();
  ctx.translate(width / 2 + 0.67, height / 2 - 4.73);
  ctx.rotate(WATERMARK_ROTATION);
  ctx.font = `500 10.355px ${styles.fontFamily}`;
  ctx.letterSpacing = '-0.4315px';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgb(16 16 16 / 0.1)';
  const wordWidth = ctx.measureText('Tecno').width;
  for (let row = 0; row < WATERMARK_ROWS; row++) {
    const y = (row - (WATERMARK_ROWS - 1) / 2) * WATERMARK_ROW_PITCH;
    let x =
      -WATERMARK_ROW_WIDTH / 2 +
      (WATERMARK_INDENTED_ROWS.includes(row) ? WATERMARK_ROW_INDENT : 0);
    for (let word = 0; word < WATERMARK_WORDS_PER_ROW; word++) {
      ctx.fillText('Tecno', x, y);
      x += wordWidth + WATERMARK_WORD_GAP;
    }
  }
  ctx.restore();

  // Painted onto the cover so it scratches away with the watermark.
  ctx.save();
  ctx.font = `600 16px ${styles.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle =
    styles.getPropertyValue('--color-slate-950').trim() || '#020617';
  COVER_PROMPT.forEach((line, index) => {
    const offset =
      (index - (COVER_PROMPT.length - 1) / 2) * COVER_PROMPT_LINE_HEIGHT;
    ctx.fillText(line, width / 2, height / 2 + offset);
  });
  ctx.restore();
}

export default function ScratchCard({
  className,
  onReveal,
  children,
}: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prizeGrainRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const hasScratchedRef = useRef(false);
  const strokeLengthRef = useRef(0);
  const scratchCountRef = useRef(0);
  const totalScratchLengthRef = useRef(0);
  const [isReady, setIsReady] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // The card can mount while hidden (closed modal, other breakpoint), so the
  // cover is painted whenever it first gets a real size.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function paint(force = false) {
      if (!canvas || (hasScratchedRef.current && !force)) return;
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      drawCover(canvas, width, height);

      const prizeGrain = prizeGrainRef.current;
      const prizeGrainCtx = prizeGrain && sizeCanvas(prizeGrain, width, height);
      if (prizeGrainCtx) {
        drawGrain(prizeGrainCtx, width, height, PRIZE_GRAIN_STRENGTH);
      }
      setIsReady(true);
    }

    const observer = new ResizeObserver(() => paint(true));
    observer.observe(canvas);
    // Repaint once the web font is in so the watermark uses it.
    document.fonts.ready.then(() => paint());

    return () => observer.disconnect();
  }, []);

  function reveal() {
    setIsRevealed(true);
    onReveal?.();
  }

  function pointFrom(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function scratchTo(point: { x: number; y: number }) {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const from = lastPointRef.current ?? point;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = BRUSH_RADIUS * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    strokeLengthRef.current += Math.hypot(point.x - from.x, point.y - from.y);
    lastPointRef.current = point;
    hasScratchedRef.current = true;
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    lastPointRef.current = null;
    strokeLengthRef.current = 0;
    scratchTo(pointFrom(event));
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    scratchTo(pointFrom(event));
  }

  function handlePointerUp(event: PointerEvent<HTMLCanvasElement>) {
    lastPointRef.current = null;
    if (strokeLengthRef.current < MIN_SCRATCH_LENGTH) return;

    scratchCountRef.current += 1;
    totalScratchLengthRef.current += strokeLengthRef.current;
    const revealDistance =
      event.currentTarget.clientWidth * REVEAL_DISTANCE_IN_CARD_WIDTHS;

    if (
      totalScratchLengthRef.current >= revealDistance ||
      scratchCountRef.current >= MAX_SCRATCHES_TO_REVEAL
    ) {
      reveal();
    }
  }

  // Keyboard users can't scratch, so Enter/Space reveals the prize outright.
  function handleKeyDown(event: KeyboardEvent<HTMLCanvasElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    reveal();
  }

  return (
    <div
      className={cn(
        'relative h-[252px] w-full overflow-hidden rounded-[4px] border border-neutral-300 bg-[#f5f5f5]',
        className,
      )}
    >
      <div
        aria-hidden={!isRevealed}
        className={cn(
          'pointer-events-none absolute inset-0 transition-[filter,scale] duration-700 select-none',
          !isReady && 'invisible',
          // Scratched areas only hint at the result until it's fully revealed;
          // the slight scale hides the soft edges the blur creates.
          !isRevealed && 'scale-110 blur-[14px]',
        )}
      >
        {children}
=======
type ScratchCardProps = { className?: string; message?: string };

export default function ScratchCard({ className, message }: ScratchCardProps) {
  const foil = useRef<HTMLCanvasElement>(null);
  const effects = useRef<HTMLCanvasElement>(null);
  const coin = useRef<HTMLSpanElement>(null);
  const surface = useRef<ScratchSurface | null>(null);
  const pointer = useRef<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!foil.current || !effects.current) return;
    const canvas = foil.current;
    let engine: ScratchSurface;
    try {
      engine = new ScratchSurface(canvas, effects.current, setProgress, () =>
        setRevealed(true),
      );
    } catch {
      return;
    }
    surface.current = engine;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      if (engine.resize(bounds.width, bounds.height)) setReady(true);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => {
      observer.disconnect();
      engine.destroy();
      surface.current = null;
    };
  }, []);

  function location(event: PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    if (coin.current) {
      coin.current.style.transform = `translate(${point.x - 20}px, ${point.y - 29}px) rotate(-28deg)`;
      coin.current.style.opacity = '1';
    }
    return point;
  }
  function end(event: PointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    surface.current?.end();
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (coin.current) coin.current.style.opacity = '0';
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          'relative isolate h-[252px] w-full overflow-hidden rounded-lg border border-neutral-400/60 shadow-[inset_0_2px_8px_#4a49352b,0_1px_0_#ffffff]',
          revealed ? 'bg-[#f8f5e9]' : 'bg-[#c9cbc1]',
          className,
        )}
      >
        <div
          aria-hidden={!revealed}
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center',
            !revealed && 'invisible',
          )}
        >
          <span className="text-xs font-semibold tracking-[0.22em] text-blue-700">
            TECNO • LUCKY DRAW
          </span>
          <p className="text-2xl font-semibold text-blue-950">
            {message ?? 'Your reveal message is coming soon'}
          </p>
        </div>
        {!ready && !revealed && (
          <div
            aria-hidden
            className="absolute inset-0 z-10 flex items-center justify-center bg-[#c9cbc1] text-sm font-semibold text-slate-600"
          >
            SCRATCH &amp; REVEAL
          </div>
        )}
        <canvas
          ref={foil}
          aria-label="Scratch the foil with your finger or mouse to reveal the message"
          className={cn(
            'absolute inset-0 h-full w-full touch-none transition-opacity duration-700 motion-reduce:transition-none',
            revealed && 'pointer-events-none opacity-0',
          )}
          onPointerDown={(event) => {
            if (revealed || pointer.current !== null || event.button !== 0)
              return;
            pointer.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            surface.current?.begin(
              location(event),
              event.pointerType === 'touch',
              event.pressure,
            );
          }}
          onPointerMove={(event) => {
            if (pointer.current === event.pointerId)
              surface.current?.move(location(event));
          }}
          onPointerUp={end}
          onPointerCancel={end}
          onLostPointerCapture={end}
        />
        <canvas
          ref={effects}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <span
          ref={coin}
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-0 left-0 h-12 w-10 rounded-[50%] border-[3px] border-[#b6aa7d] opacity-0 shadow-[2px_4px_5px_#0004,inset_0_0_0_2px_#fffa,inset_0_0_0_4px_#9e9470] [background:linear-gradient(115deg,#fff7d5_0%,#c9bf9b_24%,#fbf7df_46%,#b1a680_72%,#ece4c4_100%)]',
            revealed && 'hidden',
          )}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-600">
        <span role="status">
          {revealed
            ? 'Revealed'
            : progress > 0
              ? 'Keep scratching…'
              : 'Scratch with your finger or mouse'}
        </span>
        {!revealed && (
          <button
            type="button"
            onClick={() => {
              surface.current?.scratchStrip();
            }}
            className="shrink-0 rounded underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-700"
          >
            Scratch a strip
          </button>
        )}
      </div>
      <div
        aria-hidden
        className="mt-2 h-0.5 overflow-hidden rounded bg-slate-300/60"
      >
        <div
          className="h-full bg-blue-700 transition-[width] motion-reduce:transition-none"
          style={{
            width: `${revealed ? 100 : Math.min(100, (progress / SCRATCH_REVEAL_THRESHOLD) * 100)}%`,
          }}
        />
>>>>>>> Stashed changes
      </div>
      <canvas
        ref={prizeGrainRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
      />
      <canvas
        ref={canvasRef}
        role="button"
        tabIndex={isRevealed ? -1 : 0}
        aria-hidden={isRevealed}
        aria-label="Scratch card. Scratch the panel, or press Enter, to reveal your prize."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className={cn(
          'absolute inset-0 size-full cursor-pointer touch-none transition-opacity duration-500 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-950',
          // CSS stand-in until the canvas paints; scratched pixels must show
          // the prize, so it's dropped afterwards.
          !isReady && 'bg-scratch-card',
          isRevealed && 'pointer-events-none opacity-0',
        )}
      />
    </div>
  );
}
