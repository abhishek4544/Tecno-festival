import Image from 'next/image';

import EntryFormCard from './EntryFormCard';
import FloatingKites from './FloatingKites';
import FloatingMarigolds from '@/components/shared/FloatingMarigolds';
import LayoutWrapper from '@/components/layouts/wrapper/LayoutWrapper';

export default function HeroSection() {
  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden bg-linear-to-b from-[#1f74ff] from-0% via-[#4792ff] via-55% to-white to-100% pt-10 pb-8 md:pt-28 md:pb-0">
      <FloatingMarigolds />
      <FloatingKites />
      <LayoutWrapper>
        <div className="relative z-10 flex flex-col items-center">
          <Image
            src="/images/hero/tecno-dashain-logo-v1.webp"
            alt="Tecno Smartphone — Kinda Sunko Changa"
            width={294}
            height={137}
            preload
            sizes="(max-width: 767px) 86vw, 294px"
            className="h-auto w-[86%] max-w-[400px] md:w-[294px]"
          />
          <div className="mt-12 flex w-full justify-center">
            <EntryFormCard />
          </div>
        </div>
      </LayoutWrapper>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-white"
      />
    </section>
  );
}
