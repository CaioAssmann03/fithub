import { RequireRole } from '@/components/require-role';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="PLATFORM_ADMIN">
      <div className="mx-auto max-w-4xl p-8">{children}</div>
    </RequireRole>
  );
}
