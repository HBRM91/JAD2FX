import { useState, useEffect } from 'react';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { useAdmin } from '../context/AdminContext';

/**
 * P2.15 — Mobile Shell
 * Distinct mobile layout (≤ 640px): bottom tab bar + simplified top bar.
 * Desktop unchanged.
 */
export default function MobileShell({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const { config: _config } = useAdmin();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isMobile) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile top bar — slim */}
      <TopBar variant="mobile" />
      <main className="flex-1 pb-16">{children}</main>
      {/* Bottom tab navigation — sticky */}
      <BottomNav />
    </div>
  );
}
