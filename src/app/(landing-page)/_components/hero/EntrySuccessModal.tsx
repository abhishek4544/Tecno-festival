import Image from 'next/image';

import ScratchCard from './ScratchCard';
import Modal from '@/components/ui/modal/Modal';

type EntrySuccessModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function EntrySuccessModal({
  open,
  onClose,
}: EntrySuccessModalProps) {
  return (
    <Modal open={open} onClose={onClose} aria-label="Your Lucky Scratch Card">
      {/* Mobile & tablet */}
      <div className="relative flex h-[519px] w-[359px] flex-col items-center pt-6.75 lg:hidden">
        <div className="absolute inset-0 bg-[url('/images/success-modal/mobile-panel.png')] bg-size-[100%_100%] bg-no-repeat" />
        <Image
          src="/images/success-modal/mobile-city-illustration.png"
          alt=""
          width={359}
          height={241}
          className="absolute bottom-0 left-0 h-[241px] w-[359px] max-w-none"
        />
        <Image
          src="/images/hero/tecno-dashain-logo.webp"
          alt="Tecno Smartphone — Kinda Sunko Changa"
          width={162}
          height={72}
          className="relative h-auto w-[162px]"
        />
        <div className="relative mt-9.5 flex w-[286px] flex-col items-center gap-2">
          <h2 className="text-center text-heading-3-mobile text-slate-950">
            Your Lucky Scratch Card
          </h2>
          <ScratchCard className="h-[236px]" />
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden items-center gap-1 lg:flex">
        <div className="relative h-[438px] w-[496px] shrink-0">
          {/* The panel shape is mirrored in Figma so its notches face left. */}
          <div className="absolute inset-0 -scale-x-100 bg-[url('/images/success-modal/left-panel.png')] bg-size-[100%_100%] bg-no-repeat" />
          <Image
            src="/images/hero/tecno-dashain-logo.webp"
            alt="Tecno Smartphone — Kinda Sunko Changa"
            width={334}
            height={149}
            className="absolute top-[34.5px] left-[80px] h-auto w-[334px]"
          />
          <Image
            src="/images/success-modal/city-illustration.png"
            alt=""
            width={491}
            height={164}
            className="absolute top-[273.7px] left-[2px] h-[164px] w-[491px] max-w-none"
          />
        </div>

        <div className="relative flex h-[438px] w-[394px] shrink-0 items-center bg-[url('/images/success-modal/right-panel.png')] bg-size-[100%_100%] bg-no-repeat px-7.5">
          <div className="flex w-full flex-col gap-4">
            <h2 className="max-w-[201px] text-heading-3-desktop text-slate-950">
              Your Lucky Scratch Card
            </h2>
            <div className="flex flex-col gap-2">
              <ScratchCard />
              <p className="text-body-4-desktop-md leading-[1.1] tracking-[-0.5px] text-slate-500">
                Scratch the panel below to see what you’ve won.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
