export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 86_400_000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function last14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    days.push(addDays(today(), -i));
  }
  return days;
}

export function last28Days(): string[] {
  const days: string[] = [];
  for (let i = 27; i >= 0; i--) {
    days.push(addDays(today(), -i));
  }
  return days;
}
