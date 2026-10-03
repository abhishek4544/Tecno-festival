import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="admin-scope flex min-h-screen flex-col">{children}</div>;
}
