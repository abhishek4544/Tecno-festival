import PrizeItem from './PrizeItem';

import type { PrizeCard } from '../../_data';

type PrizeListProps = {
  items: PrizeCard[];
};

export default function PrizeList({ items }: PrizeListProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {items.map((item) => (
        <PrizeItem key={item.title} card={item} />
      ))}
    </div>
  );
}
