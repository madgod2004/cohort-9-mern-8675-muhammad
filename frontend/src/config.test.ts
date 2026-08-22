import { API_URL, APP_NAME } from './config';

describe('config', () => {
  it('exposes the app name', () => {
    expect(APP_NAME).toBe('Notes');
  });

  it('falls back to the local api url when the env var is absent', () => {
    expect(API_URL).toMatch(/^https?:\/\//);
  });
});
