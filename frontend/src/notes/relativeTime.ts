const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) {
    return '';
  }

  let delta = (then.getTime() - now.getTime()) / 1000;

  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(delta) < amount) {
      return formatter.format(Math.round(delta), unit);
    }
    delta /= amount;
  }

  return formatter.format(Math.round(delta), 'year');
}
