/* eslint-disable import/no-extraneous-dependencies -- Vitest runs from the frontend assembly */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { makeStore, renderWithProviders, screen } from '@openimis/fe-core/testing';
import { PAYROLL_PAYMENT_FILES_TAB_VALUE } from '../../constants';
import { PayrollPaymentFilesTabPanel } from './PayrollPaymentFilesTab';

// A modules manager with fe-core's refs only: PolicyHolderModule is not installed,
// so policyHolder.TabPanel is not registered.
const { refs } = vi.hoisted(() => ({ refs: {} }));

vi.mock('@openimis/fe-core', async () => {
  const ReactActual = (await import('react')).default;
  refs['core.TabPanel'] = ({ value, index, children }) => (
    value === index ? ReactActual.createElement('div', { 'data-testid': 'core-tab-panel' }, children) : null
  );
  return {
    useTranslations: () => ({ formatMessage: (id) => id }),
    PublishedComponent: ({ pubRef, ...props }) => {
      const Component = refs[pubRef];
      return Component ? ReactActual.createElement(Component, props) : null;
    },
  };
});

vi.mock('./PayrollPaymentFilesSearcher', () => ({
  default: ({ payrollUuid }) => <div data-testid="payment-files-searcher">{payrollUuid}</div>,
}));

const store = () => makeStore({ preloadedState: { core: { user: { i_user: { rights: [] } } } } });

describe('PayrollPaymentFilesTabPanel', () => {
  it('renders its content through core.TabPanel without PolicyHolderModule', () => {
    renderWithProviders(
      <PayrollPaymentFilesTabPanel value={PAYROLL_PAYMENT_FILES_TAB_VALUE} payrollUuid="p-1" />,
      { store: store() },
    );

    expect(screen.getByTestId('payment-files-searcher')).toHaveTextContent('p-1');
  });
});
