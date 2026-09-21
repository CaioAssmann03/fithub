import { RequireRole } from '@/components/require-role';
import { Sidebar } from '@/components/nav/sidebar';

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="PERSONAL_TRAINER">
      <div className="flex">
        <Sidebar />
        <main className="min-h-screen flex-1 overflow-x-hidden bg-slate-50 p-8">{children}</main>
      </div>
    </RequireRole>
  );
}
