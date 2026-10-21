/* eslint-disable import/no-extraneous-dependencies -- Vitest runs from the frontend assembly */
import React from 'react';
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
  Searcher: function Searcher({ items, itemFormatters, rowDisabled }) {
    return (
      <table>
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
vi.mock('./PayrollFilter', () => ({ default: () => null }));
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
  return { props, setConfirmed };
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
