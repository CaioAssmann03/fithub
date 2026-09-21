type Tone = 'danger' | 'warning' | 'success';

const TONE_CLASSES: Record<Tone, string> = {
  danger: 'bg-danger-50 text-danger-600 border-danger-500/20',
  warning: 'bg-warning-50 text-warning-600 border-warning-500/20',
  success: 'bg-brand-50 text-brand-700 border-brand-500/20',
};

export function Alert({ children, tone = 'danger' }: { children: React.ReactNode; tone?: Tone }) {
  if (!children) return null;
  return <div className={`rounded-md border px-3.5 py-2.5 text-sm ${TONE_CLASSES[tone]}`}>{children}</div>;
}
