'use client';

import { useState } from 'react';

import EntrySuccessModal from '../(landing-page)/_components/hero/EntrySuccessModal';

import { scratchPrizes, type ScratchPrize } from '../(landing-page)/_data';

export default function ScratchPreviewPage() {
  const [open, setOpen] = useState(true);
  const [prize, setPrize] = useState<ScratchPrize | null>(scratchPrizes[0]);
  const [previewCount, setPreviewCount] = useState(0);

  function preview(next: ScratchPrize | null) {
    setPrize(next);
    // Remount the modal so each preview starts unscratched.
    setPreviewCount((count) => count + 1);
    setOpen(true);
  }

  return (
    <main className="flex min-h-dvh flex-wrap items-center justify-center gap-3 bg-gradient-to-b from-blue-400 to-blue-100 p-6">
      {scratchPrizes.map((option) => (
        <button
          key={option.name}
          type="button"
          onClick={() => preview(option)}
          className="rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white"
        >
          Try: {option.name}
        </button>
      ))}
      <button
        type="button"
        onClick={() => preview(null)}
        className="rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white"
      >
        Try: no win
      </button>
      <EntrySuccessModal
        key={previewCount}
        open={open}
        onClose={() => setOpen(false)}
        prize={prize}
      />
    </main>
  );
}
