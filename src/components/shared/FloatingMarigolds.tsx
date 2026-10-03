import type { CSSProperties } from 'react';
import Image from 'next/image';

const flowers = [
  {
    position: 'hidden md:block md:w-12 lg:w-18',
    start: [8, 16],
    depth: 'near',
  },
  {
    position: 'hidden md:block md:w-9 lg:w-11',
    start: [86, 29],
    depth: 'middle',
  },
  {
    position: 'w-3 lg:w-5',
    start: [24, 41],
    depth: 'far',
  },
  {
    position: 'w-7 md:w-8 lg:w-12',
    start: [10, 66],
    depth: 'middle',
  },
  {
    position: 'w-12 lg:w-20',
    start: [92, 81],
    depth: 'near',
  },
  {
    position: 'w-3.5 lg:w-6',
    start: [78, 53],
    depth: 'far',
  },
  {
    position: 'hidden w-4 lg:block',
    start: [18, 85],
    depth: 'far',
  },
  {
    position: 'hidden w-7 lg:block',
    start: [68, 15],
    depth: 'middle',
  },
  {
    position: 'hidden md:block md:w-8 lg:w-12',
    start: [17, 27],
    depth: 'middle',
  },
  {
    position: 'hidden md:block md:w-10 lg:w-16',
    start: [82, 12],
    depth: 'near',
  },
  {
    position: 'hidden w-10 md:block lg:w-14',
    start: [7, 49],
    depth: 'middle',
  },
  {
    position: 'hidden w-5 md:block lg:w-7',
    start: [94, 64],
    depth: 'far',
  },
  {
    position: 'hidden w-8 lg:block',
    start: [35, 9],
    depth: 'middle',
  },
  {
    position: 'hidden w-11 lg:block',
    start: [60, 23],
    depth: 'middle',
  },
  {
    position: 'w-[20px] lg:w-[32px]',
    start: [52, 6],
    depth: 'middle',
  },
  {
    position: 'w-[12px] lg:w-[20px]',
    start: [40, 72],
    depth: 'far',
  },
  {
    position: 'w-[36px] lg:w-[56px]',
    start: [64, 38],
    depth: 'near',
  },
  {
    position: 'w-[14px] lg:w-[24px]',
    start: [4, 92],
    depth: 'far',
  },
  {
    position: 'hidden md:block md:w-[28px] lg:w-[40px]',
    start: [46, 58],
    depth: 'middle',
  },
  {
    position: 'hidden md:block md:w-[16px] lg:w-[24px]',
    start: [30, 18],
    depth: 'far',
  },
  {
    position: 'hidden md:block md:w-[44px] lg:w-[64px]',
    start: [74, 88],
    depth: 'near',
  },
  {
    position: 'hidden lg:block lg:w-[36px]',
    start: [55, 47],
    depth: 'middle',
  },
  {
    position: 'hidden lg:block lg:w-[20px]',
    start: [88, 44],
    depth: 'far',
  },
  {
    position: 'hidden lg:block lg:w-[48px]',
    start: [26, 60],
    depth: 'near',
  },
  // Mobile only
  {
    position: 'w-[24px] md:hidden',
    start: [3, 22],
    depth: 'middle',
  },
  {
    position: 'w-[28px] md:hidden',
    start: [95, 34],
    depth: 'near',
  },
  {
    position: 'w-[12px] md:hidden',
    start: [34, 4],
    depth: 'far',
  },
  {
    position: 'w-[18px] md:hidden',
    start: [72, 58],
    depth: 'middle',
  },
  {
    position: 'w-[10px] md:hidden',
    start: [97, 76],
    depth: 'far',
  },
  {
    position: 'w-[22px] md:hidden',
    start: [2, 45],
    depth: 'middle',
  },
  {
    position: 'w-[30px] md:hidden',
    start: [58, 26],
    depth: 'near',
  },
  {
    position: 'w-[14px] md:hidden',
    start: [16, 12],
    depth: 'far',
  },
] as const;

const depthStyles = {
  near: {
    duration: 20,
    sizes: '(min-width: 1024px) 56px, 34px',
  },
  middle: {
    duration: 28,
    sizes: '(min-width: 1024px) 34px, 26px',
  },
  far: {
    duration: 36,
    sizes: '(min-width: 1024px) 17px, 10px',
  },
};

// Stable timing staggers the falling flowers without hydration changes.
function flowerMotion(
  index: number,
  flower: (typeof flowers)[number],
): CSSProperties {
  let seed = (index + 1) * 7919;
  const random = (min: number, max: number) => {
    seed = (seed * 16807) % 2147483647;
    return min + (seed / 2147483647) * (max - min);
  };
  const duration = depthStyles[flower.depth].duration + random(0, 8);
  const style: Record<string, string | number> = {
    '--flower-duration': `${duration}s`,
    // Golden-ratio steps keep every flower on its own phase, so they never
    // fall in clumps however many there are.
    '--flower-delay': `${-duration * ((index * 0.618 + 0.1) % 1)}s`,
    '--flower-sway-duration': `${random(5, 9)}s`,
    '--flower-sway': `clamp(4px, ${random(0.6, 1.8).toFixed(2)}cqw, 24px)`,
    '--flower-spin-duration': `${random(31, 57)}s`,
    '--flower-rotation': `${random(-180, 180)}deg`,
    '--flower-turn': `${random(25, 65)}deg`,
    '--flower-tilt-x': `${random(-6, 6)}deg`,
    '--flower-tilt-y': `${random(-5, 5)}deg`,
    '--flower-tilt-end': `${random(4, 10)}deg`,
    '--flower-x': `${flower.start[0]}cqw`,
    '--flower-rest-y': `${flower.start[1]}cqh`,
  };
  return style as CSSProperties;
}

export default function FloatingMarigolds() {
  return (
    <div
      aria-hidden="true"
      className="[container-type:size] pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      {flowers.map((flower, index) => (
        <div
          key={flower.start.join('-')}
          className={`floating-marigold absolute top-0 left-0 ${flower.position}`}
          data-depth={flower.depth}
          style={flowerMotion(index, flower)}
        >
          <div className="floating-marigold-sway">
            <div className="scale-[0.7]">
              <Image
                src="/images/shared/marigold-falling.png"
                alt=""
                width={1254}
                height={1254}
                sizes={depthStyles[flower.depth].sizes}
                draggable={false}
                className="floating-marigold-bloom block h-auto w-full"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
