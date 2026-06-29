import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { I18nProvider } from '../../context/I18nContext';
import PriceAlerts from '../../components/PriceAlerts';

/**
 * P2.29 — RTL test 3: PriceAlerts doesn't crash with empty rate list.
 */
describe('PriceAlerts component (P2.29)', () => {
  it('renders without crashing on empty rates', () => {
    const { container } = render(
      <I18nProvider>
        <PriceAlerts rates={[]} />
      </I18nProvider>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('handles zero rates without errors', () => {
    expect(() => {
      render(
        <I18nProvider>
          <PriceAlerts rates={[]} />
        </I18nProvider>,
      );
    }).not.toThrow();
  });
});
