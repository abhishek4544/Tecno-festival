import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Register the custom `--text-*` type scale from globals.css as font sizes so
// tailwind-merge doesn't mistake them for text colors (e.g. `text-slate-900`).
export const twMergeConfig = {
  extend: {
    theme: {
      text: [
        'display-1-desktop',
        'display-1-desktop-md',
        'display-1-mobile',
        'display-1-mobile-md',
        'heading-1-desktop',
        'heading-1-desktop-md',
        'heading-1-mobile',
        'heading-1-mobile-md',
        'heading-2-desktop',
        'heading-2-desktop-md',
        'heading-2-mobile',
        'heading-2-mobile-md',
        'heading-3-desktop',
        'heading-3-desktop-md',
        'heading-3-mobile',
        'heading-3-mobile-md',
        'title-1-desktop',
        'title-1-desktop-md',
        'title-1-mobile',
        'title-1-mobile-md',
        'body-4-desktop',
        'body-4-desktop-md',
        'caption-1-desktop',
        'caption-1-desktop-md',
      ],
    },
  },
};

const twMerge = extendTailwindMerge(twMergeConfig);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
