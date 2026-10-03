import type { ReactNode } from 'react';

type LayoutWrapperProps = {
  children: ReactNode;
};

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="max-w-[1400px] px-4 md:px-8 xl:mx-auto">{children}</div>
  );
}
