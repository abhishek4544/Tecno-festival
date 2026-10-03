export type ScratchPrize = {
  // Matches the `reward_kind` the entry API returns.
  kind: 'SilverKite' | 'SilverCoin';
  name: string;
  image: string;
};

// Prizes a scratch card can reveal to a winner.
export const scratchPrizes: ScratchPrize[] = [
  {
    kind: 'SilverKite',
    name: 'Silver Kite',
    image: '/images/success-modal/prize-silver-kite-v1.webp',
  },
  {
    kind: 'SilverCoin',
    name: 'Silver Coin',
    image: '/images/success-modal/prize-silver-coin.webp',
  },
];
