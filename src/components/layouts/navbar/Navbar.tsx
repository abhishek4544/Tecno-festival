import SoundToggleButton from './SoundToggleButton';
import { icon } from '@/components/icons';
import { buttonClasses } from '@/components/ui/buttons/Button';
import LayoutWrapper from '@/components/layouts/wrapper/LayoutWrapper';

import { externalLink } from '@/constants';

export default function Navbar() {
  return (
    <header className="absolute inset-x-0 top-0 z-50 py-6 md:fixed">
      <LayoutWrapper>
        <div className="flex items-center justify-between">
          <SoundToggleButton />
          <a
            href={externalLink.tecnoWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({
              variant: 'brand',
              className: 'hidden md:inline-flex',
            })}
          >
            Visit Website
            <icon.arrowUpRight aria-hidden className="size-[14px]" />
          </a>
        </div>
      </LayoutWrapper>
    </header>
  );
}
