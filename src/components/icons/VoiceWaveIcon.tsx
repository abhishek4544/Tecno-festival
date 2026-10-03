import type { SVGProps } from 'react';

import { cn } from '@/lib/utils';

const bars = [
  { x: 2.8125, y1: 7.3125, y2: 10.6875, delay: '-0.3s' },
  { x: 5.8125, y1: 2.8125, y2: 15.1875, delay: '0s' },
  { x: 9, y1: 5.8125, y2: 12.1875, delay: '-0.45s' },
  { x: 12.1875, y1: 4.3125, y2: 13.6875, delay: '-0.15s' },
  { x: 15.1875, y1: 7.3125, y2: 10.6875, delay: '-0.6s' },
];

type VoiceWaveIconProps = {
  isAnimating?: boolean;
} & SVGProps<SVGSVGElement>;

export function VoiceWaveIcon({
  isAnimating = false,
  ...props
}: VoiceWaveIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      {...props}
    >
      {bars.map((bar) => (
        <path
          key={bar.x}
          d={`M${bar.x} ${bar.y1}V${bar.y2}`}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
          style={{ animationDelay: bar.delay }}
          className={cn(
            'origin-center transform-fill',
            isAnimating && 'motion-safe:animate-voice-wave',
          )}
        />
      ))}
    </svg>
  );
}
