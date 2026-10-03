'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  children: ReactNode;
};

// Built on the native <dialog>: `showModal()` gives us the top layer, focus
// trapping, Escape-to-close and a `::backdrop` we style as the blur overlay.
export default function Modal({
  open,
  onClose,
  className,
  children,
  ...otherProps
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Lock page scroll while open. Padding replaces the hidden scrollbar's width
  // so the page doesn't shift sideways on browsers with classic scrollbars.
  useEffect(() => {
    if (!open) return;

    const { documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = documentElement.style.overflow;
    const previousPaddingRight = documentElement.style.paddingRight;

    documentElement.style.overflow = 'hidden';
    documentElement.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      documentElement.style.overflow = previousOverflow;
      documentElement.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        'm-auto max-h-[calc(100dvh-32px)] max-w-[calc(100vw-32px)] overflow-auto bg-transparent p-0 backdrop:bg-slate-950/20 backdrop:backdrop-blur-[16px]',
        className,
      )}
      {...otherProps}
    >
      {children}
    </dialog>
  );
}
