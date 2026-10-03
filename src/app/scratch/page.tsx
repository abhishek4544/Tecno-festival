'use client';

import { useState } from 'react';
import EntrySuccessModal from '../(landing-page)/_components/hero/EntrySuccessModal';

export default function ScratchPreviewPage() {
  const [open, setOpen] = useState(true);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-blue-400 to-blue-100 p-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-900 px-6 py-3 font-semibold text-white"
      >
        Try the scratch card
      </button>
      <EntrySuccessModal open={open} onClose={() => setOpen(false)} />
    </main>
  );
}
