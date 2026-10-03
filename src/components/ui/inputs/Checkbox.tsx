import type { ComponentPropsWithRef, ReactNode } from 'react';

import { icon } from '@/components/icons';

import { cn } from '@/lib/utils';

type CheckboxProps = {
  label: ReactNode;
  error?: string;
} & Omit<ComponentPropsWithRef<'input'>, 'type'>;

export default function Checkbox({
  label,
  error,
  className,
  ...otherProps
}: CheckboxProps) {
  const errorId =
    error && otherProps.name ? `${otherProps.name}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="flex cursor-pointer items-center gap-3 text-caption-1-desktop text-slate-900">
        <span className="relative flex size-[18px] shrink-0 items-center justify-center">
          <input
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className="peer absolute inset-0 cursor-pointer appearance-none rounded-[5.4px] border-[0.9px] border-slate-300 bg-white transition-colors outline-none checked:border-brand-500 checked:bg-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500"
            {...otherProps}
          />
          <icon.check
            aria-hidden
            className="pointer-events-none relative hidden size-[12px] text-white peer-checked:block"
          />
        </span>
        <span>{label}</span>
      </label>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="pl-7.5 text-caption-1-desktop text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}
