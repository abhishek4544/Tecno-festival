import EntryForm from './EntryForm';
import Diya from '@/components/shared/Diya';

export default function EntryFormCard() {
  return (
    <div className="relative flex w-full max-w-[664px] flex-col items-start gap-6 overflow-hidden rounded-[8px] bg-white/85 px-5 pt-6 pb-21 backdrop-blur-[16px] md:items-center md:gap-12 md:rounded-[12px] md:px-8 md:pt-12 md:pb-42">
      <div className="relative flex flex-col items-start gap-1.5 md:items-center md:text-center">
        <h1 className="text-heading-2-mobile text-navy-800 md:max-w-none md:text-heading-1-mobile">
          <span className="md:hidden">Lucky Draw</span>
          <span className="hidden md:inline">Join the Lucky Draw</span>
        </h1>
        <p className="max-w-[290px] text-[13px] leading-[1.2] text-slate-500 md:max-w-none md:text-body-4-desktop md:leading-[1.2]">
          Enter your name, mobile number, and the IMEI number of your new phone
          below.
        </p>
      </div>

      <div className="relative w-full">
        <EntryForm />
      </div>

      {/* Mobile */}
      <Diya size="sm" className="bottom-1 left-5 md:hidden" />
      <Diya size="sm" className="right-8 bottom-1 md:hidden" />

      {/* Desktop */}
      <Diya className="bottom-9 left-3.25 hidden md:flex" />
      <Diya className="right-3 bottom-9 hidden md:flex" />
    </div>
  );
}
