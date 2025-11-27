import type { ReactNode } from 'react';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 overflow-y-scroll">
      <Header />
      <main className="mt-5">
        {children}
      </main>
    </div>
  );
}

