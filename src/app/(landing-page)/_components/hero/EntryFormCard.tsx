import EntryForm from './EntryForm';
import Diya from '@/components/shared/Diya';

export default function EntryFormCard() {
  return (
    <div className="flex w-full max-w-[664px] flex-col gap-3.75">
      {/* Mobile: heading sits above the card on the blue background */}
      <div className="flex flex-col gap-1 text-white md:hidden">
        <h1 className="text-heading-2-mobile">Lucky Draw</h1>
        <p className="max-w-[250px] text-caption-1-desktop leading-[1.2]">
          Enter your name, mobile number, and the IMEI number of your new phone
          below.
        </p>
      </div>

      <div className="relative flex w-full flex-col items-center gap-6 overflow-hidden rounded-[8px] bg-white/85 px-4 pt-4 pb-21 backdrop-blur-[16px] md:gap-12 md:rounded-[12px] md:px-8 md:pt-12 md:pb-42">
        <div className="relative hidden flex-col items-center gap-1.5 text-center md:flex">
          <h1 className="text-heading-1-mobile text-navy-800">
            Join the Lucky Draw
          </h1>
          <p className="text-body-4-desktop leading-[1.2] text-slate-500">
            Enter your name, mobile number, and the IMEI number of your new
            phone below.
          </p>
        </div>

        <div className="relative w-full">
          <EntryForm />
        </div>

        {/* Mobile */}
        <Diya size="sm" className="bottom-0 left-3 md:hidden" />
        <Diya size="sm" className="right-3 bottom-0 md:hidden" />

        {/* Desktop */}
        <Diya className="bottom-9 left-3.25 hidden md:flex" />
        <Diya className="right-3 bottom-9 hidden md:flex" />
      </div>
    </div>
  );
}
