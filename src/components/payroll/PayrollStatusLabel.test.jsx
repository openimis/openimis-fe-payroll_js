import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// fe-core's barrel imports itself, so the real helpers come from their defining modules.
vi.mock('@openimis/fe-core', async () => {
  const modules = await vi.importActual('@openimis/fe-core/helpers/modules');
  const i18n = await vi.importActual('@openimis/fe-core/helpers/i18n');
  return { useModulesManager: modules.useModulesManager, useTranslations: i18n.useTranslations };
});

const { default: PayrollStatusLabel } = await import('./PayrollStatusLabel');
const { default: messages } = await import('../../translations/en.json');
const { renderWithProviders } = await import('@openimis/fe-core/testing');

const renderLabel = (status) => renderWithProviders(<div><PayrollStatusLabel status={status} /></div>, { messages })
  .container.textContent;

describe('PayrollStatusLabel', () => {
  it.each([
    ['PENDING_APPROVAL', 'PENDING APPROVAL'],
    ['APPROVE_FOR_PAYMENT', 'APPROVE FOR PAYMENT'],
    ['RECONCILIATED', 'RECONCILED'],
    ['FAILED', 'FAILED'],
  ])('translates %s', (status, label) => {
    expect(renderLabel(status)).toBe(label);
  });

  it('shows a status it has no translation for as sent', () => {
    expect(renderLabel('PARTIALLY_PAID')).toBe('PARTIALLY_PAID');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
  ])('renders nothing for %s', (_label, status) => {
    expect(renderLabel(status)).toBe('');
  });
});
