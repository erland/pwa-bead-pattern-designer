import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder / TextDecoder for react-router & others in Jest
if (typeof globalThis.TextEncoder === 'undefined') {
  (globalThis as any).TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  (globalThis as any).TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}