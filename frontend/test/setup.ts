import { TextDecoder, TextEncoder } from 'node:util';

import '@testing-library/jest-dom';

// jsdom omits these; react-router needs them
Object.assign(globalThis, { TextEncoder, TextDecoder });
