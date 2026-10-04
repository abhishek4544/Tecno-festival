import Image from 'next/image';
import Link from 'next/link';

import TermsList from './TermsList';
import LayoutWrapper from '@/components/layouts/wrapper/LayoutWrapper';
import { icon } from '@/components/icons';

import { LANDING_PAGE } from '@/constants';
import { termsClauses } from '../_data';

export default function TermsSection() {
  return (
    <section className="relative isolate w-full pt-10 pb-16 md:pt-28 md:pb-24">
      {/* Same blue-to-white sky as the hero, fixed to the top of the page. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-linear-to-b from-[#1f74ff] from-0% via-[#4792ff] via-55% to-white to-100%"
      />

      <LayoutWrapper>
        <div className="flex flex-col items-center">
          <Link href={LANDING_PAGE} aria-label="Back to the lucky draw">
            <Image
              src="/images/hero/tecno-dashain-logo-v1.webp"
              alt="Tecno Smartphone — Kinda Sunko Changa"
              width={294}
              height={137}
              preload
              sizes="(max-width: 767px) 60vw, 220px"
              className="h-auto w-[60%] max-w-[260px] md:w-[220px]"
            />
          </Link>

          <article className="mt-10 flex w-full max-w-[800px] flex-col gap-8 rounded-[8px] bg-white/85 px-4 py-8 shadow-[0_8px_40px_rgb(12_41_86/0.08)] backdrop-blur-[16px] md:mt-12 md:gap-10 md:rounded-[12px] md:px-12 md:py-12">
            <Link
              href={LANDING_PAGE}
              className="inline-flex items-center gap-2 self-start text-body-4-desktop-md text-navy-800 hover:underline"
            >
              <icon.arrowLeft aria-hidden="true" />
              Back
            </Link>

            <header className="flex flex-col gap-1.5 text-center">
              <h1 className="text-heading-1-mobile text-navy-800">
                Terms &amp; Conditions
              </h1>
              <p className="text-body-4-desktop leading-[1.2] text-slate-500">
                TECNO Dashain Lucky Draw
              </p>
            </header>

            <TermsList items={termsClauses} />
          </article>
        </div>
      </LayoutWrapper>
    </section>
  );
}
