type Point = { x: number; y: number };
type Flake = Point & {
  vx: number;
  vy: number;
  size: number;
  life: number;
  angle: number;
};

export const SCRATCH_REVEAL_THRESHOLD = 0.7;

export function clearedFraction(pixels: Uint8ClampedArray): number {
  if (!pixels.length) return 0;
  let alpha = 0;
  for (let i = 3; i < pixels.length; i += 4) alpha += pixels[i];
  return alpha / (255 * (pixels.length / 4));
}

function randomSource(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function paintCoating(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const random = randomSource(47291);
  const metal = ctx.createLinearGradient(0, 0, width, height);
  for (const [stop, color] of [
    [0, '#eef0e9'],
    [0.16, '#a9ada4'],
    [0.34, '#eee9d4'],
    [0.48, '#c4c6bd'],
    [0.66, '#f8f5e5'],
    [0.82, '#aeb4ad'],
    [1, '#e4e6dc'],
  ] as const)
    metal.addColorStop(stop, color);
  ctx.fillStyle = metal;
  ctx.fillRect(0, 0, width, height);

  // Fine irregular grain and directional brushing are part of the removable coat.
  const grain = document.createElement('canvas');
  grain.width = Math.ceil(width);
  grain.height = Math.ceil(height);
  const grainCtx = grain.getContext('2d')!;
  const noise = grainCtx.createImageData(grain.width, grain.height);
  for (let i = 0; i < noise.data.length; i += 4) {
    const shade = random() > 0.5 ? 255 : 35;
    noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = shade;
    noise.data[i + 3] = Math.round(random() * 32);
  }
  grainCtx.putImageData(noise, 0, 0);
  ctx.drawImage(grain, 0, 0, width, height);
  for (let i = 0; i < height * 3; i++) {
    const x = random() * width;
    const y = random() * height;
    ctx.strokeStyle = `rgba(${random() > 0.5 ? '255,255,255' : '72,78,70'},${random() * 0.16})`;
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 10 + random() * 75, y - 0.7);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.font = '600 10px Arial, sans-serif';
  ctx.fillStyle = 'rgba(67,75,67,.15)';
  for (let y = -height * 2; y < height * 2; y += 38) {
    for (let x = -width * 2; x < width * 2; x += 76)
      ctx.fillText('TECNO', x, y);
  }
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.font = '600 18px Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.fillText('SCRATCH & REVEAL', width / 2, height / 2 + 1);
  ctx.fillStyle = '#62675b';
  ctx.fillText('SCRATCH & REVEAL', width / 2, height / 2);
  ctx.font = '12px Arial, sans-serif';
  ctx.fillStyle = '#74796b';
  ctx.fillText('Use your finger or drag a coin', width / 2, height / 2 + 24);
  ctx.strokeStyle = 'rgba(255,255,255,.65)';
  ctx.lineWidth = 1;
  ctx.strokeRect(1.5, 1.5, width - 3, height - 3);
}

function stamp(
  ctx: CanvasRenderingContext2D,
  point: Point,
  radius: number,
  seed: number,
) {
  const random = randomSource(seed);
  // Light abrasion at the fringe, then a fully removed, irregular inner patch.
  for (const [scale, alpha] of [
    [1.15, 0.2],
    [0.84, 1],
  ] as const) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath();
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const r = radius * scale * (0.88 + random() * 0.24);
      const x = point.x + Math.cos(angle) * r;
      const y = point.y + Math.sin(angle) * r * 0.78;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }
}

export class ScratchSurface {
  private mask = document.createElement('canvas');
  private sample = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private maskCtx: CanvasRenderingContext2D;
  private effectsCtx: CanvasRenderingContext2D;
  private sampleCtx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private previous: Point | null = null;
  private radius = 20;
  private keyboardRow = 0;
  private seed = 1;
  private lastCheck = 0;
  private revealed = false;
  private flakes: Flake[] = [];
  private frame = 0;
  private lastFrame = 0;
  private motionPreference = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  );

  constructor(
    private canvas: HTMLCanvasElement,
    private effects: HTMLCanvasElement,
    private onProgress: (fraction: number) => void,
    private onReveal: () => void,
  ) {
    const ctx = canvas.getContext('2d');
    const maskCtx = this.mask.getContext('2d');
    const effectsCtx = effects.getContext('2d');
    const sampleCtx = this.sample.getContext('2d', {
      willReadFrequently: true,
    });
    if (!ctx || !maskCtx || !effectsCtx || !sampleCtx)
      throw new Error('Canvas unavailable');
    this.ctx = ctx;
    this.maskCtx = maskCtx;
    this.effectsCtx = effectsCtx;
    this.sampleCtx = sampleCtx;
    this.sample.width = this.sample.height = 64;
  }

  resize(width: number, height: number) {
    if (width < 1 || height < 1) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (width === this.width && height === this.height && dpr === this.dpr)
      return true;
    const saved = document.createElement('canvas');
    saved.width = this.mask.width;
    saved.height = this.mask.height;
    saved.getContext('2d')!.drawImage(this.mask, 0, 0);
    const hadSurface = this.width > 0;
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    for (const canvas of [this.canvas, this.effects, this.mask]) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    if (hadSurface)
      this.maskCtx.drawImage(saved, 0, 0, this.mask.width, this.mask.height);
    for (const ctx of [this.ctx, this.maskCtx, this.effectsCtx])
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintCoating(this.ctx, width, height);
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.drawImage(this.mask, 0, 0, width, height);
    this.ctx.globalCompositeOperation = 'source-over';
    this.previous = null;
    return true;
  }

  begin(point: Point, touch: boolean, pressure: number) {
    if (this.revealed || !this.width) return;
    this.radius = touch ? 25 : 19;
    if (pressure > 0 && pressure !== 0.5) this.radius *= 0.85 + pressure * 0.3;
    this.previous = point;
    this.erase(point);
    this.checkProgress(true);
  }

  move(point: Point) {
    if (!this.previous || this.revealed) return;
    const from = this.previous;
    const distance = Math.hypot(point.x - from.x, point.y - from.y);
    if (distance < 0.5) return;
    const steps = Math.max(1, Math.ceil(distance / 3));
    for (let i = 1; i <= steps; i++) {
      this.erase({
        x: from.x + ((point.x - from.x) * i) / steps,
        y: from.y + ((point.y - from.y) * i) / steps,
      });
    }
    this.previous = point;
    if (!this.motionPreference.matches)
      this.shedFlakes(point, point.x - from.x, point.y - from.y);
    this.checkProgress(false);
  }

  end() {
    this.previous = null;
    this.checkProgress(true);
  }

  scratchStrip() {
    if (!this.width || this.revealed) return;
    const y = 12 + this.keyboardRow * 24;
    this.begin({ x: 0, y }, false, 0.5);
    this.move({ x: this.width, y });
    this.end();
    this.keyboardRow = (this.keyboardRow + 1) % Math.ceil(this.height / 24);
  }

  reveal() {
    if (this.revealed) return;
    this.revealed = true;
    this.previous = null;
    this.onProgress(1);
    this.onReveal();
  }

  private erase(point: Point) {
    this.seed++;
    this.ctx.globalCompositeOperation = 'destination-out';
    stamp(this.ctx, point, this.radius, this.seed);
    this.ctx.globalCompositeOperation = 'source-over';
    stamp(this.maskCtx, point, this.radius, this.seed);
  }

  private checkProgress(force: boolean) {
    if (!this.width || this.revealed) return;
    const now = performance.now();
    if (!force && now - this.lastCheck < 100) return;
    this.lastCheck = now;
    this.sampleCtx.clearRect(0, 0, 64, 64);
    this.sampleCtx.drawImage(this.mask, 0, 0, 64, 64);
    const fraction = clearedFraction(
      this.sampleCtx.getImageData(0, 0, 64, 64).data,
    );
    if (fraction >= SCRATCH_REVEAL_THRESHOLD) this.reveal();
    else this.onProgress(fraction);
  }

  private shedFlakes(point: Point, dx: number, dy: number) {
    for (let i = 0; i < 4; i++) {
      this.flakes.push({
        ...point,
        vx: Math.max(-2, Math.min(2, dx * 0.06)) + (Math.random() - 0.5) * 2,
        vy: Math.max(-1.5, Math.min(1.5, dy * 0.05)) - Math.random() * 1.8,
        size: 0.7 + Math.random() * 1.5,
        life: 1,
        angle: Math.random() * Math.PI,
      });
    }
    this.flakes = this.flakes.slice(-140);
    if (!this.frame) {
      this.lastFrame = performance.now();
      this.frame = requestAnimationFrame(this.animateFlakes);
    }
  }

  private animateFlakes = (time: number) => {
    const step = Math.min((time - this.lastFrame) / 16.67, 3);
    this.lastFrame = time;
    this.effectsCtx.clearRect(0, 0, this.width, this.height);
    this.flakes = this.flakes.filter((flake) => flake.life > 0);
    for (const flake of this.flakes) {
      flake.x += flake.vx * step;
      flake.y += flake.vy * step;
      flake.vy += 0.09 * step;
      flake.life -= 0.025 * step;
      flake.angle += 0.07 * step;
      this.effectsCtx.save();
      this.effectsCtx.translate(flake.x, flake.y);
      this.effectsCtx.rotate(flake.angle);
      this.effectsCtx.globalAlpha = Math.max(0, flake.life) * 0.85;
      this.effectsCtx.fillStyle = flake.size > 1.6 ? '#f5f0d9' : '#7e8379';
      this.effectsCtx.fillRect(0, 0, flake.size * 2.5, flake.size);
      this.effectsCtx.restore();
    }
    this.frame = this.flakes.length
      ? requestAnimationFrame(this.animateFlakes)
      : 0;
  };

  destroy() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.flakes = [];
    this.previous = null;
  }
}
