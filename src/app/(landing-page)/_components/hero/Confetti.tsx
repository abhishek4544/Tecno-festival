import type { CSSProperties } from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

import { confettiPieces, type ConfettiPiece } from '../../_data';

const PARTICLE_COUNT = 64;
// Ribbon shapes are drawn far longer than they appear in the design.
const RIBBON_MIN_HEIGHT = 20;
const RIBBON_SCALE = 0.5;

type ConfettiProps = {
  className?: string;
};

// Stable per-particle values so server and client render the same markup.
function particleStyle(index: number): CSSProperties {
  let seed = (index + 1) * 7919;
  const random = (min: number, max: number) => {
    seed = (seed * 16807) % 2147483647;
    return min + (seed / 2147483647) * (max - min);
  };
  const style: Record<string, string> = {
    '--confetti-x': `${random(0, 100).toFixed(2)}cqw`,
    '--confetti-delay': `${random(0, 1.6).toFixed(2)}s`,
    '--confetti-duration': `${random(2.8, 4.4).toFixed(2)}s`,
    '--confetti-sway': `${random(6, 18).toFixed(1)}px`,
    '--confetti-sway-duration': `${random(0.9, 1.6).toFixed(2)}s`,
    '--confetti-rotation': `${random(-180, 180).toFixed(0)}deg`,
    '--confetti-spin': `${random(-540, 540).toFixed(0)}deg`,
    '--confetti-flip-duration': `${random(0.6, 1.3).toFixed(2)}s`,
  };
  return style as CSSProperties;
}

function pieceSize(piece: ConfettiPiece) {
  const scale = piece.height > RIBBON_MIN_HEIGHT ? RIBBON_SCALE : 1;
  return { width: piece.width * scale, height: piece.height * scale };
}

// Confetti falling from the top of its container, continuously.
export default function Confetti({ className }: ConfettiProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        '[container-type:size] pointer-events-none absolute overflow-hidden select-none',
        className,
      )}
    >
      {Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const piece = confettiPieces[index % confettiPieces.length];
        const { width, height } = pieceSize(piece);

        return (
          <div
            key={index}
            className="confetti-piece absolute top-0 left-0"
            style={particleStyle(index)}
          >
            <div className="confetti-sway">
              <Image
                src={piece.src}
                alt=""
                width={piece.width}
                height={piece.height}
                draggable={false}
                className="confetti-flip block max-w-none"
                style={{ width, height }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
