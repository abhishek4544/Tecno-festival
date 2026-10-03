export type ScratchPrize = {
  name: string;
  image: string;
};

// Prizes a scratch card can reveal to a winner.
export const scratchPrizes: ScratchPrize[] = [
  {
    name: 'Silver Kite',
    image: '/images/success-modal/prize-silver-kite-v1.webp',
  },
  {
    name: 'Silver Coin',
    image: '/images/success-modal/prize-silver-coin.webp',
  },
];
