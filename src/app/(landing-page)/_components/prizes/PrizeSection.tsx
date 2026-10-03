import Image from 'next/image';

import PrizeList from './PrizeList';
import LayoutWrapper from '@/components/layouts/wrapper/LayoutWrapper';

import { prizes } from '../../_data';

export default function PrizeSection() {
  return (
    <section className="relative hidden w-full overflow-hidden bg-white py-12 md:block lg:py-21">
      <Image
        src="/images/prizes/floral-pattern.png"
        alt=""
        width={553}
        height={511}
        className="pointer-events-none absolute -top-5 -left-[334px] h-[511px] w-[553px] max-w-none opacity-20"
      />
      <Image
        src="/images/prizes/floral-pattern.png"
        alt=""
        width={429}
        height={397}
        className="pointer-events-none absolute top-[227px] -right-[265px] h-[397px] w-[429px] max-w-none opacity-20"
      />

      <LayoutWrapper>
        <div className="relative mx-auto flex w-full max-w-[1043px] flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-4 text-center lg:gap-3.5">
            <h2 className="text-heading-1-mobile text-navy-950 lg:text-heading-1-desktop">
              Prizes Worth Celebrating
            </h2>
            <p className="text-title-1-mobile-md text-azure-500 lg:text-title-1-desktop-md">
              Celebrate. Participate. Win.
            </p>
          </div>
          <PrizeList items={prizes} />
        </div>
      </LayoutWrapper>
    </section>
  );
}
