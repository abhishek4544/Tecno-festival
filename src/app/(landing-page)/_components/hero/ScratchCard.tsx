import { cn } from '@/lib/utils';

const WATERMARK_ROWS = 9;
const WATERMARK_WORDS_PER_ROW = 12;

type ScratchCardProps = {
  className?: string;
};

export default function ScratchCard({ className }: ScratchCardProps) {
  return (
    <div
      className={cn(
        'bg-scratch-card relative h-[252px] w-full overflow-hidden rounded-[4px] border border-neutral-300',
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute top-[calc(50%-5px)] left-1/2 flex h-[685px] w-[713px] -translate-1/2 items-center justify-center"
      >
        <div className="flex w-[632px] -rotate-[40.77deg] flex-col gap-7">
          {Array.from({ length: WATERMARK_ROWS }, (_, row) => (
            <div
              key={row}
              className={cn(
                'flex h-[15px] items-center gap-4',
                row % 2 === 0 && 'px-8',
              )}
            >
              {Array.from({ length: WATERMARK_WORDS_PER_ROW }, (_, word) => (
                <span
                  key={word}
                  className="text-caption-1-desktop-md tracking-[-0.5px] whitespace-nowrap text-ink-900/24"
                >
                  Tecno
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
