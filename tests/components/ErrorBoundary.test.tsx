import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '../../components/ErrorBoundary';

function getText(container: HTMLElement, text: string | RegExp): boolean {
  return Array.from(container.querySelectorAll('*')).some(
    (el) => typeof el.textContent === 'string' && (typeof text === 'string' ? el.textContent.includes(text) : text.test(el.textContent)),
  );
}

function ThrowingChild(): never {
  throw new Error('Boom!');
}

function GoodChild() {
  return <div>Hello</div>;
}

describe('ErrorBoundary', () => {
  // Suppress React's noisy error logging for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    const { container } = render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );
    expect(container.textContent).toContain('Hello');
  });

  it('renders fallback when child throws', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(container.textContent).toMatch(/Une erreur est survenue/i);
    expect(container.textContent).toContain('Boom!');
  });

  it('calls onError prop when child throws', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('reset button is present in fallback UI', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(getText(container, /Une erreur est survenue/i)).toBe(true);
    const buttons = Array.from(container.querySelectorAll('button')) as HTMLButtonElement[];
    const resetBtn = buttons.find((b: HTMLButtonElement) => !!b.textContent && /Réessayer/i.test(b.textContent));
    expect(resetBtn).toBeDefined();
    const reloadBtn = buttons.find((b: HTMLButtonElement) => !!b.textContent && /Recharger/i.test(b.textContent));
    expect(reloadBtn).toBeDefined();
  });
});
