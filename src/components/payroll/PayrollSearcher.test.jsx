/* eslint-disable import/no-extraneous-dependencies -- Vitest runs from the frontend assembly */
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import {
  act, fireEvent, render, screen,
} from '@testing-library/react';
import {
  describe, expect, it, vi,
} from 'vitest';

vi.mock('@openimis/fe-core', () => ({
  GetIconComponent: (name) => function Icon() { return <span>{name}</span>; },
  useTranslations: () => ({ formatMessage: (key) => key, formatMessageWithValues: (key) => key }),
  useModulesManager: () => ({ getRef: (ref) => ref }),
  useHistory: () => ({ push: vi.fn() }),
  coreConfirm: vi.fn(),
  journalize: vi.fn(),
  // One row per item, each cell from the searcher's formatters.
  // Renders the filter pane the way fe-core's Searcher does: as a component type.
  Searcher: function Searcher({
    items, itemFormatters, rowDisabled, FilterPane,
  }) {
    return (
      <table>
        {!!FilterPane && <caption><FilterPane filters={{}} onChangeFilters={() => {}} /></caption>}
        <tbody>
          {items.map((item) => (
            <tr key={item.id} data-testid={`row-${item.id}`} data-disabled={String(!!rowDisabled(null, item))}>
              {itemFormatters().map((format, i) => <td key={i}>{format(item)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

vi.mock('../../actions', () => ({
  fetchPayrolls: vi.fn(),
  deletePayrolls: vi.fn(),
  retriggerPayroll: vi.fn(),
  fetchPayrollSystemStatus: vi.fn(),
}));
vi.mock('../../reducer', () => ({ ACTION_TYPE: {} }));
// Counts how often the filter pane, and the pickers in it, is mounted.
const filterMounts = vi.hoisted(() => ({ count: 0 }));
vi.mock('./PayrollFilter', () => ({
  default: function PayrollFilter() {
    useEffect(() => { filterMounts.count += 1; }, []);
    return null;
  },
}));
vi.mock('./GenerationProgress', () => ({ default: () => null }));
vi.mock('./PayrollStatusLabel', () => ({ default: () => null }));

const { PayrollSearcher } = await import('./PayrollSearcher');
const { PAYROLL_STATUS } = await import('../../constants');

const ITEM = { id: 'item-1', name: 'P1', status: PAYROLL_STATUS.PENDING_APPROVAL };
const EXTRA_PROPS = { fetchPayrolls: vi.fn(), fetchPayrollSystemStatus: vi.fn(), retriggerPayroll: vi.fn() };

const store = createStore((state = { core: { user: { i_user: { rights: [] } } } }) => state);

const renderSearcher = () => {
  const props = {
    ...EXTRA_PROPS,
    payrolls: [ITEM],
    deletePayrolls: vi.fn(),
    coreConfirm: vi.fn(),
    journalize: vi.fn(),
    clearConfirm: vi.fn(),
    confirmed: null,
  };
  const ui = (extra) => <Provider store={store}><PayrollSearcher {...props} {...extra} /></Provider>;
  const view = render(ui());
  // Stands in for any other dialog in the app being answered.
  const setConfirmed = (confirmed) => view.rerender(ui({ confirmed }));
  return { props, setConfirmed, rerender: (extra) => view.rerender(ui(extra)) };
};

const clickDelete = () => fireEvent.click(screen.getByText('Delete').closest('button'));

describe('PayrollSearcher delete', () => {
  it('deletes once and greys the row when its own dialog is confirmed', () => {
    const { props } = renderSearcher();

    clickDelete();
    expect(props.deletePayrolls).not.toHaveBeenCalled();
    act(() => props.coreConfirm.mock.calls.at(-1)?.[2]?.onConfirm());

    expect(props.deletePayrolls).toHaveBeenCalledTimes(1);
    expect(props.deletePayrolls.mock.calls[0][0]).toEqual(ITEM);
    expect(screen.getByTestId('row-item-1').dataset.disabled).toBe('true');
  });

  it('does not delete when another dialog in the app is answered "Yes"', () => {
    const { props, setConfirmed } = renderSearcher();

    clickDelete();
    act(() => setConfirmed(true));

    expect(props.deletePayrolls).not.toHaveBeenCalled();
  });
});

describe('PayrollSearcher filters', () => {
  // A remounted filter pane remounts its pickers, and each one queries the server again:
  // the page re-renders as soon as the payrolls are being fetched, then once they are.
  it('mounts the filter pane once while the payrolls are fetched', () => {
    filterMounts.count = 0;
    const { rerender } = renderSearcher();
    rerender({ fetchingPayrolls: true });
    rerender({ fetchingPayrolls: false, fetchedPayrolls: true });

    expect(filterMounts.count).toBe(1);
  });
});
