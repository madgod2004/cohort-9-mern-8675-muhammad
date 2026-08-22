// The app name is a placeholder. It appears in the wordmark and the page
// title, so renaming means changing it here only.
export const APP_NAME = 'Notes';

// import.meta.env is injected by Vite and absent under Jest, so this has to
// tolerate the whole object being undefined rather than just the key
export const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:3000';
