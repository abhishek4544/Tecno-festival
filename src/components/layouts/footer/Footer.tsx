import Image from 'next/image';

import LayoutWrapper from '@/components/layouts/wrapper/LayoutWrapper';

export default function Footer() {
  return (
    <footer className="bg-footer-glow relative h-[367px] w-full overflow-hidden lg:h-[592px]">
      <div className="absolute -bottom-5.5 left-0 h-[274px] w-[max(824px,100%)] lg:-bottom-6.5 lg:h-[504px] lg:w-[max(1513px,100%)]">
        <Image
          src="/images/footer/chhath-devotees.png"
          alt="Devotees standing in a river offering Chhath prayers at sunrise"
          fill
          sizes="(min-width: 1513px) 100vw, (min-width: 1024px) 1513px, 824px"
          className="pointer-events-none object-cover object-left"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[88px] bg-linear-to-t from-white from-[19.357%] to-white/0 lg:h-[246px]" />

      <LayoutWrapper>
        <p className="relative pt-19.5 text-display-1-mobile text-navy-900 lg:mx-auto lg:max-w-[697px] lg:pt-13.5 lg:text-center lg:text-display-1-desktop">
          दशैं, तिहार तथा छठको <br className="lg:hidden" />
          हार्दिक मंगलमय शुभकामना।
        </p>
      </LayoutWrapper>
    </footer>
  );
}
