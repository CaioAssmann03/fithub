'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const LINKS = [
  { href: '/dashboard', label: 'Painel' },
  { href: '/students', label: 'Alunos' },
  { href: '/exercises', label: 'Exercícios' },
  { href: '/foods', label: 'Alimentos' },
  { href: '/appointments', label: 'Agenda' },
  { href: '/notifications', label: 'Notificações' },
  { href: '/settings', label: 'Configurações' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-5 text-lg font-semibold text-brand-700">FitHub</div>
      <nav className="flex-1 space-y-1 px-3">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <button
          onClick={logout}
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
