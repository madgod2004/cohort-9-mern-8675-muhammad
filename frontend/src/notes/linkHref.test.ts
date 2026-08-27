import { normaliseHref } from './linkHref';

describe('normaliseHref', () => {
  it('keeps a full address as it is', () => {
    expect(normaliseHref('https://example.com/plans')).toBe('https://example.com/plans');
  });

  it('assumes https for a bare domain, which is what people type', () => {
    expect(normaliseHref('example.com')).toBe('https://example.com/');
    expect(normaliseHref('example.com/plans')).toBe('https://example.com/plans');
  });

  it('allows plain http', () => {
    expect(normaliseHref('http://example.com/')).toBe('http://example.com/');
  });

  it('allows an email address', () => {
    expect(normaliseHref('mailto:alice@example.com')).toBe('mailto:alice@example.com');
  });

  it('ignores surrounding whitespace', () => {
    expect(normaliseHref('  https://example.com/  ')).toBe('https://example.com/');
  });

  it('refuses a javascript: address', () => {
    expect(normaliseHref('javascript:alert(1)')).toBeNull();
  });

  it('refuses other schemes that are not links', () => {
    expect(normaliseHref('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(normaliseHref('file:///etc/passwd')).toBeNull();
  });

  it('refuses nothing at all', () => {
    expect(normaliseHref('')).toBeNull();
    expect(normaliseHref('   ')).toBeNull();
  });

  it('refuses something that cannot be parsed', () => {
    expect(normaliseHref('http://')).toBeNull();
  });
});
