import Image from 'next/image';

import type { ScratchPrize } from '../../_data';

type ScratchResultProps = {
  // The prize won, or null when the entry didn't win.
  prize: ScratchPrize | null;
};

// What the scratch card reveals: the prize for winners, otherwise the bumper
// draw prize with a note that the entry is still in the running.
export default function ScratchResult({ prize }: ScratchResultProps) {
  if (prize) {
    return (
      <Image
        src={prize.image}
        alt={`Your prize: a ${prize.name.toLowerCase()}`}
        width={800}
        height={800}
        sizes="334px"
        draggable={false}
        className="absolute inset-0 size-full object-cover"
      />
    );
  }

  return (
    <>
      <Image
        src="/images/success-modal/prize-gold-kite.webp"
        alt="The bumper prize: a gold kite"
        width={800}
        height={800}
        sizes="334px"
        draggable={false}
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute -bottom-[19px] left-1/2 h-[68px] w-[334px] -translate-x-1/2 bg-ember-950 blur-[26px]" />
      <p className="absolute bottom-5.5 left-1/2 w-[248px] -translate-x-1/2 translate-y-1/2 text-center text-caption-1-desktop leading-[1.24] font-semibold text-white">
        YOU ARE OFFICIALLY IN THE BUMPER LUCKY DRAW FOR A CHANCE TO WIN IT!
      </p>
    </>
  );
}
