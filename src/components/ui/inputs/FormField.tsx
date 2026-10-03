import type { ReactNode } from 'react';

type FormFieldProps = {
  label: string;
  htmlFor: string;
  action?: ReactNode;
  error?: string;
  children: ReactNode;
};

export function getErrorId(htmlFor: string) {
  return `${htmlFor}-error`;
}

export default function FormField({
  label,
  htmlFor,
  action,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-body-4-desktop leading-none text-slate-950"
        >
          {label}
        </label>
        {action}
      </div>
      <div className="flex flex-col gap-1.5">
        {children}
        {error && (
          <p
            id={getErrorId(htmlFor)}
            role="alert"
            className="text-caption-1-desktop text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
