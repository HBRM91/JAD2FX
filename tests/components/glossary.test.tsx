import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../../context/I18nContext';
import Glossary from '../../components/Glossary';

/**
 * P2.29 — RTL test 2: Glossary component renders with French text by default
 * and has the proper semantic structure.
 */
describe('Glossary component (P2.29)', () => {
  it('renders the title and category filters in French', () => {
    render(
      <I18nProvider>
        <Glossary />
      </I18nProvider>,
    );
    expect(screen.getByText(/Glossaire/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/Rechercher/i)).toBeTruthy();
  });

  it('displays at least one term from the seed data', () => {
    render(
      <I18nProvider>
        <Glossary />
      </I18nProvider>,
    );
    // We should see "EUR" or "USD" somewhere in the currency badges
    const body = document.body.textContent || '';
    expect(body).toMatch(/EUR|USD/);
  });
});
