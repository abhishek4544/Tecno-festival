import Image from 'next/image';

import { tv } from 'tailwind-variants';

import { twMergeConfig } from '@/lib/utils';

export const diyaClasses = tv(
  {
    slots: {
      base: 'pointer-events-none absolute flex flex-col items-center',
      lamp: 'relative overflow-hidden',
      glow: 'bg-ember-800',
    },
    variants: {
      size: {
        sm: {
          lamp: 'h-[32px] w-[46px]',
          glow: 'h-[6px] w-[23px] blur-[8.5px]',
        },
        md: {
          lamp: 'h-[48px] w-[71px]',
          glow: 'h-[8px] w-[28px] blur-[10.3px]',
        },
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
  { twMergeConfig },
);

type DiyaProps = {
  size?: 'sm' | 'md';
  className?: string;
};

export default function Diya({ size = 'md', className }: DiyaProps) {
  const { base, lamp, glow } = diyaClasses({ size });

  return (
    <div className={base({ className })}>
      <div className={lamp()}>
        <Image
          src="/images/shared/diya.png"
          alt=""
          width={71}
          height={71}
          className="absolute top-[-17.57%] left-0 h-[148.65%] w-full max-w-none"
        />
      </div>
      <div className={glow()} />
    </div>
  );
}
