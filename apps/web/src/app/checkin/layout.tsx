import { RequireRole } from '@/components/require-role';

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="STUDENT">
      <div className="mx-auto max-w-lg px-4 py-8">{children}</div>
    </RequireRole>
  );
}
