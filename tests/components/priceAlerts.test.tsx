import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { I18nProvider } from '../../context/I18nContext';
import { AdminProvider } from '../../context/AdminContext';
import PriceAlerts from '../../components/PriceAlerts';

/**
 * P2.29 — RTL test 3: PriceAlerts doesn't crash with empty rate list.
 */
describe('PriceAlerts component (P2.29)', () => {
  it('renders without crashing on empty rates', () => {
    const { container } = render(
      <AdminProvider>
        <I18nProvider>
          <PriceAlerts rates={[]} />
        </I18nProvider>
      </AdminProvider>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('handles zero rates without errors', () => {
    expect(() => {
      render(
        <AdminProvider>
          <I18nProvider>
            <PriceAlerts rates={[]} />
          </I18nProvider>
        </AdminProvider>,
      );
    }).not.toThrow();
  });
});
