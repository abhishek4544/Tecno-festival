import Image from 'next/image';

import type { PrizeCard } from '../../_data';

type PrizeItemProps = {
  card: PrizeCard;
};

export default function PrizeItem({ card }: PrizeItemProps) {
  return (
    <article className="flex flex-col gap-4">
      <div className="relative h-[250px] w-full overflow-hidden rounded-[9px] bg-neutral-100 lg:h-[228px]">
        <Image
          src={card.image}
          alt={card.imageAlt}
          fill
          sizes="(min-width: 1024px) 332px, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
          style={{ objectPosition: card.imagePosition }}
        />
      </div>
      <div className="flex flex-col gap-3 lg:gap-2">
        <h3 className="text-heading-2-desktop-md text-navy-950">
          {card.title}
        </h3>
        <p className="text-body-4-desktop leading-none text-slate-500">
          {card.description}
        </p>
      </div>
    </article>
  );
}
