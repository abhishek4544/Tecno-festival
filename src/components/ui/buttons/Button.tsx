import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { tv } from 'tailwind-variants';

import { twMergeConfig } from '@/lib/utils';

export const buttonClasses = tv(
  {
    base: 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2.5 text-body-4-desktop-md whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:pointer-events-none disabled:opacity-50',
    variants: {
      variant: {
        solid: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        glass:
          'bg-white/70 text-slate-950 backdrop-blur-[16px] hover:bg-white/85',
        brand:
          'gap-2 bg-white/70 text-slate-950 backdrop-blur-[16px] hover:bg-white/85',
        gold: 'bg-gold-glow border-[1.5px] border-gold-700 font-semibold text-gold-950 shadow-button-shine transition-[filter] hover:brightness-105',
      },
      size: {
        sm: 'rounded-[6px] px-3 py-2',
        md: 'rounded-[8px] px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'sm',
    },
  },
  { twMergeConfig },
);

type ButtonProps = {
  variant?: 'solid' | 'glass' | 'brand' | 'gold';
  size?: 'sm' | 'md';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
} & ComponentPropsWithoutRef<'button'>;

export default function Button({
  variant = 'solid',
  size = 'sm',
  leftIcon,
  rightIcon,
  type = 'button',
  className,
  children,
  ...otherProps
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...otherProps}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
