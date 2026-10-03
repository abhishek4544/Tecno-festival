import type { ComponentPropsWithRef } from 'react';

import { icon } from '@/components/icons';

import { cn } from '@/lib/utils';

export type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  options: DropdownOption[];
  placeholder?: string;
} & ComponentPropsWithRef<'select'>;

export default function Dropdown({
  options,
  placeholder,
  className,
  defaultValue,
  ...otherProps
}: DropdownProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <select
        defaultValue={
          defaultValue ?? (placeholder && !otherProps.value ? '' : undefined)
        }
        className="h-[40px] w-full cursor-pointer appearance-none rounded-[8px] border border-slate-100 bg-white pr-10 pl-3.75 text-body-4-desktop text-slate-900 shadow-input transition-colors outline-none focus:border-azure-500 disabled:cursor-not-allowed disabled:opacity-50 has-[option[value='']:checked]:text-slate-400 aria-invalid:border-red-500 [&_option]:text-slate-900"
        {...otherProps}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <icon.chevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3.75 size-[16px] -translate-y-1/2 text-black"
      />
    </div>
  );
}
