'use client';

import { useState } from 'react';
import Image from 'next/image';

import Confetti from './Confetti';
import ScratchCard from './ScratchCard';
import ScratchResult from './ScratchResult';
import Modal from '@/components/ui/modal/Modal';

import { cn } from '@/lib/utils';

import type { ScratchPrize } from '../../_data';

const SCRATCH_HEADING = 'Your Lucky Scratch Card';
const NON_WINNER_HEADING = 'THE GOLD KITE AWAITS!';

type EntrySuccessModalProps = {
  open: boolean;
  onClose: () => void;
  // The prize won, or null when the entry didn't win.
  prize: ScratchPrize | null;
};

export default function EntrySuccessModal({
  open,
  onClose,
  prize,
}: EntrySuccessModalProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const isWinner = prize !== null;
  const resultHeading = prize
    ? `CONGRATULATIONS! YOU’VE WON A ${prize.name.toUpperCase()}!`
    : NON_WINNER_HEADING;
  const heading = isRevealed ? resultHeading : SCRATCH_HEADING;

  return (
    <Modal open={open} onClose={onClose} aria-label="Your Lucky Scratch Card">
      {/* Mobile & tablet */}
      <div className="relative h-[599px] w-[359px] overflow-hidden lg:hidden">
        <div className="absolute top-[0.28px] left-[0.5px] h-[598px] w-[359px] bg-[url('/images/success-modal/mobile-panel-v1.png')] bg-size-[100%_100%] bg-no-repeat" />
        <Image
          src="/images/success-modal/mobile-city-illustration-v1.png"
          alt=""
          width={359}
          height={257}
          className="absolute top-[355px] left-[0.5px] h-[256.5px] w-[359px] max-w-none"
        />
        <Image
          src="/images/hero/tecno-dashain-logo-v1.webp"
          alt="Tecno Smartphone — Kinda Sunko Changa"
          width={205}
          height={96}
          className="absolute top-[22px] left-1/2 h-auto w-[205px] -translate-x-1/2"
        />
        <h2
          aria-live="polite"
          className={cn(
            'absolute top-[169px] left-1/2 w-[260px] -translate-1/2 text-center text-heading-3-mobile text-slate-950',
            isRevealed &&
              (isWinner
                ? 'leading-[1.24]'
                : 'w-auto text-heading-4-mobile whitespace-nowrap'),
          )}
        >
          {heading}
        </h2>
        <ScratchCard
          onReveal={() => setIsRevealed(true)}
          className="absolute top-[194px] left-[37px] h-[236px] w-[286px]"
        >
          <ScratchResult prize={prize} />
        </ScratchCard>
        {isRevealed && isWinner && (
          <Confetti className="top-0 -left-[2px] h-[485px] w-[364px]" />
        )}
      </div>

      {/* Desktop */}
      <div className="relative hidden items-center gap-1 lg:flex">
        <div className="relative h-[438px] w-[496px] shrink-0">
          {/* The panel shape is mirrored in Figma so its notches face left. */}
          <div className="absolute inset-0 -scale-x-100 bg-[url('/images/success-modal/left-panel.png')] bg-size-[100%_100%] bg-no-repeat" />
          <Image
            src="/images/hero/tecno-dashain-logo-v1.webp"
            alt="Tecno Smartphone — Kinda Sunko Changa"
            width={334}
            height={156}
            className="absolute top-[34.5px] left-[80px] h-auto w-[334px]"
          />
          <Image
            src="/images/success-modal/city-illustration.png"
            alt=""
            width={491}
            height={164}
            className="absolute top-[273.7px] left-[2px] h-[164px] w-[491px] max-w-none"
          />
        </div>

        <div className="relative flex min-h-[540px] w-[min(359px,calc(100vw-32px))] shrink-0 flex-col items-center justify-center gap-6 bg-[url('/images/success-modal/mobile-panel.png')] bg-size-[100%_100%] bg-no-repeat px-6 py-10 lg:min-h-[470px] lg:w-[394px] lg:bg-[url('/images/success-modal/right-panel.png')] lg:px-7.5">
          <Image
            src="/images/hero/tecno-dashain-logo.webp"
            alt="Tecno Smartphone — Kinda Sunko Changa"
            width={162}
            height={72}
            className="h-auto w-[162px] lg:hidden"
          />
          <div className="flex w-full flex-col gap-4">
            <h2
              aria-live="polite"
              className={cn(
                'text-heading-3-desktop text-slate-950',
                isRevealed ? 'leading-[1.24]' : 'max-w-[201px]',
              )}
            >
              {heading}
            </h2>
            <ScratchCard onReveal={() => setIsRevealed(true)}>
              <ScratchResult prize={prize} />
            </ScratchCard>
          </div>
        </div>

        {isRevealed && isWinner && <Confetti className="inset-0" />}
      </div>
    </Modal>
  );
}
