import Image from 'next/image';

import { tv } from 'tailwind-variants';

import { twMergeConfig } from '@/lib/utils';

export const garlandClasses = tv(
  {
    slots: {
      base: 'pointer-events-none absolute h-[113px] overflow-hidden',
      image: 'absolute top-0 max-w-none',
    },
    variants: {
      variant: {
        // One strand, cropped from the middle of the image.
        single: {
          base: 'w-[41px]',
          image: 'left-[-53.66%] h-[99.76%] w-[212.3%]',
        },
        // The full image, showing both strands.
        pair: {
          base: 'w-[87px]',
          image: 'left-0 size-full',
        },
      },
    },
    defaultVariants: {
      variant: 'single',
    },
  },
  { twMergeConfig },
);

type GarlandProps = {
  variant?: 'single' | 'pair';
  className?: string;
};

export default function Garland({
  variant = 'single',
  className,
}: GarlandProps) {
  const { base, image } = garlandClasses({ variant });

  return (
    <div className={base({ className })}>
      <Image
        src="/images/shared/marigold-garland.png"
        alt=""
        width={87}
        height={113}
        className={image()}
      />
    </div>
  );
}
