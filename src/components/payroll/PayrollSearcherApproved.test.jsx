/* eslint-disable import/no-extraneous-dependencies -- Vitest runs from the frontend assembly */
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { render } from '@testing-library/react';
import {
  describe, expect, it, vi,
} from 'vitest';

vi.mock('@openimis/fe-core', () => ({
  useTranslations: () => ({ formatMessage: (key) => key, formatMessageWithValues: (key) => key }),
  useModulesManager: () => ({ getRef: (ref) => ref }),
  useHistory: () => ({ push: vi.fn() }),
  coreConfirm: vi.fn(),
  journalize: vi.fn(),
  // Renders the filter pane the way fe-core's Searcher does: as a component type.
  Searcher: function Searcher({ FilterPane }) {
    return FilterPane ? <FilterPane filters={{}} onChangeFilters={() => {}} /> : null;
  },
}));

vi.mock('../../actions', () => ({ fetchPayrolls: vi.fn() }));
vi.mock('./dialogs/PaymentApproveForPaymentSummary', () => ({ default: () => null }));
vi.mock('./dialogs/PayrollReconciliationFilesDialog', () => ({ default: () => null }));
vi.mock('./PayrollStatusLabel', () => ({ default: () => null }));
// Counts how often the filter pane, and the pickers in it, is mounted.
const filterMounts = vi.hoisted(() => ({ count: 0 }));
vi.mock('./PayrollFilter', () => ({
  default: function PayrollFilter() {
    useEffect(() => { filterMounts.count += 1; }, []);
    return null;
  },
}));

const { PayrollSearcherApproved } = await import('./PayrollSearcherApproved');

const store = createStore((state = { core: { user: { i_user: { rights: [] } } } }) => state);

describe('PayrollSearcherApproved filters', () => {
  // A remounted filter pane remounts its pickers, and each one queries the server again:
  // the page re-renders as soon as the payrolls are being fetched, then once they are.
  it('mounts the filter pane once while the payrolls are fetched', () => {
    const ui = (extra) => (
      <Provider store={store}>
        <PayrollSearcherApproved payrolls={[]} fetchPayrolls={vi.fn()} {...extra} />
      </Provider>
    );
    const view = render(ui());
    view.rerender(ui({ fetchingPayrolls: true }));
    view.rerender(ui({ fetchingPayrolls: false, fetchedPayrolls: true }));

    expect(filterMounts.count).toBe(1);
  });
});
