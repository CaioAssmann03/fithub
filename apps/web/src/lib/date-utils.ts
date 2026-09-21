/**
 * `new Date('2026-09-10').toLocaleDateString()` parseia a string como
 * meia-noite UTC — num fuso atrás de UTC (ex: America/Sao_Paulo), isso
 * exibe o dia anterior. Datas puras (nascimento, data de avaliação — sem
 * hora, vindas de coluna `@db.Date`) precisam ser lidas pelos componentes
 * literais, nunca através do parser de Date com fuso. Timestamps de
 * verdade (createdAt, scheduledAt, submittedAt) não têm esse problema —
 * `new Date(iso).toLocaleString()` neles é local e correto.
 */
export function formatDateOnly(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

/** Data local de hoje em YYYY-MM-DD, pro valor padrão de um <input type="date">. */
export function todayDateOnly(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
