import '@testing-library/jest-dom/vitest';
import {
  beforeAll as _beforeAll,
  afterAll as _afterAll,
  beforeEach as _beforeEach,
  afterEach as _afterEach,
} from 'vitest';

(globalThis as Record<string, unknown>).beforeAll = _beforeAll;
(globalThis as Record<string, unknown>).afterAll = _afterAll;
(globalThis as Record<string, unknown>).beforeEach = _beforeEach;
(globalThis as Record<string, unknown>).afterEach = _afterEach;

// jsdom polyfills for tests
if (typeof globalThis.IntersectionObserver === 'undefined') {
  (globalThis as Record<string, unknown>).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  };
}

if (typeof globalThis.matchMedia === 'undefined') {
  (globalThis as Record<string, unknown>).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
