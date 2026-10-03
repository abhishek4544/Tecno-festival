export type PrizeCard = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
};

export const prizes: PrizeCard[] = [
  {
    title: 'Gold Kite',
    description: 'The grand festive reward',
    image: '/images/prizes/gold-kite.png',
    imageAlt: 'Golden kite surrounded by falling confetti',
    imagePosition: '50% 0%',
  },
  {
    title: 'Silver Kite',
    description: 'A shining win awaits',
    image: '/images/prizes/silver-kite.png',
    imageAlt: 'Silver kite surrounded by falling confetti',
    imagePosition: '50% 8%',
  },
  {
    title: 'Silver Coin',
    description: 'The grand festive reward',
    image: '/images/prizes/silver-coin.png',
    imageAlt: 'Silver coin engraved with a kite',
  },
];
