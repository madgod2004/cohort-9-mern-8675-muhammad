import { relativeTime } from './relativeTime';

const NOW = new Date('2026-08-24T12:00:00.000Z');

function ago(ms: number): string {
  return relativeTime(new Date(NOW.getTime() - ms).toISOString(), NOW);
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('relativeTime', () => {
  it('says "now" only at the moment itself', () => {
    expect(ago(0)).toBe('now');
  });

  it('counts seconds', () => {
    expect(ago(2 * SECOND)).toBe('2 seconds ago');
  });

  it('counts minutes and hours', () => {
    expect(ago(5 * MINUTE)).toBe('5 minutes ago');
    expect(ago(2 * HOUR)).toBe('2 hours ago');
  });

  it('uses the friendly word for a single day rather than "1 day ago"', () => {
    expect(ago(DAY)).toBe('yesterday');
  });

  it('counts days up to a week', () => {
    expect(ago(3 * DAY)).toBe('3 days ago');
  });

  it('rolls over into weeks', () => {
    expect(ago(8 * DAY)).toBe('last week');
    expect(ago(21 * DAY)).toBe('3 weeks ago');
  });

  it('rolls over into months and years', () => {
    expect(ago(60 * DAY)).toBe('2 months ago');
    expect(ago(800 * DAY)).toBe('2 years ago');
  });

  it('returns an empty string rather than "Invalid Date" for junk', () => {
    expect(relativeTime('not a date', NOW)).toBe('');
  });
});
