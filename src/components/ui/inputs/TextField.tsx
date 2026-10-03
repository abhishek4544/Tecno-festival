import type { ComponentPropsWithRef } from 'react';

import { cn } from '@/lib/utils';

type TextFieldProps = ComponentPropsWithRef<'input'>;

export default function TextField({
  type = 'text',
  className,
  ...otherProps
}: TextFieldProps) {
  return (
    <input
      type={type}
      className={cn(
        'h-[40px] w-full rounded-[8px] border border-slate-100 bg-white px-3.75 text-body-4-desktop text-slate-900 shadow-input transition-colors outline-none placeholder:text-slate-400 focus:border-azure-500 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500',
        className,
      )}
      {...otherProps}
    />
  );
}
