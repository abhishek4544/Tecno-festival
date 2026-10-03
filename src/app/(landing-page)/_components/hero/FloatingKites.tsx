import type { CSSProperties } from 'react';
import Image from 'next/image';

const kiteStringPath = 'M90 0C89 30 69 43 62 72S46 126 0 160';

const kites = [
  {
    position: 'top-44 left-3 w-9 md:top-8 md:left-[10%] md:w-16 lg:w-24',
    sizes: '(min-width: 1024px) 96px, (min-width: 768px) 64px, 36px',
    duration: '8s',
    delay: '-2s',
    facing: 'left',
  },
  {
    position: 'top-48 right-3 w-9 md:top-16 md:right-[10%] md:w-20 lg:w-28',
    sizes: '(min-width: 1024px) 112px, (min-width: 768px) 80px, 36px',
    duration: '10s',
    delay: '-6s',
    facing: 'right',
  },
  {
    position:
      'top-52 left-16 w-9 md:top-[42%] md:right-auto md:bottom-auto md:left-2 md:w-7 lg:left-[6%] lg:w-16 xl:left-[14%] xl:w-20',
    sizes: '(min-width: 1280px) 80px, (min-width: 1024px) 64px, 36px',
    duration: '9s',
    delay: '-4s',
    facing: 'left',
  },
  {
    position:
      'top-56 right-16 w-9 md:top-[54%] md:left-auto md:bottom-auto md:right-2 md:w-7 lg:right-[6%] lg:w-18 xl:right-[14%] xl:w-24',
    sizes: '(min-width: 1280px) 96px, (min-width: 1024px) 72px, 36px',
    duration: '11s',
    delay: '-8s',
    facing: 'right',
  },
] as const;

export default function FloatingKites() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none md:top-24 md:bottom-0"
    >
      {kites.map((kite) => (
        <div
          key={kite.position}
          className={`floating-kite absolute ${kite.position}`}
          style={
            {
              '--kite-duration': kite.duration,
              '--kite-delay': kite.delay,
            } as CSSProperties
          }
        >
          <div
            className={`floating-kite-rig ${kite.facing === 'right' ? 'scale-x-[-1]' : ''}`}
          >
            <svg
              viewBox="0 0 90 160"
              fill="none"
              className="absolute top-[87%] right-[65%] h-10 w-6 overflow-visible md:h-auto md:w-[180%]"
            >
              <path
                d={kiteStringPath}
                stroke="#526882"
                strokeOpacity=".72"
                strokeWidth=".75"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <Image
              src="/images/hero/kites/silver-smooth-v2.png"
              alt=""
              width={1254}
              height={1254}
              sizes={kite.sizes}
              className="floating-kite-foil relative block h-auto w-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
