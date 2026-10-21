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
  fetchPaymentPoints: vi.fn(),
  deletePaymentPoint: vi.fn(),
}));
vi.mock('./PaymentPointFilter', () => ({ default: () => null }));

const { PaymentPointSearcher } = await import('./PaymentPointSearcher');

const ITEM = { id: 'item-1', name: 'PP1', ppm: null };
const EXTRA_PROPS = { fetchPaymentPoints: vi.fn() };

const store = createStore((state = { core: { user: { i_user: { rights: [] } } } }) => state);

const renderSearcher = () => {
  const props = {
    ...EXTRA_PROPS,
    paymentPoints: [ITEM],
    deletePaymentPoint: vi.fn(),
    coreConfirm: vi.fn(),
    journalize: vi.fn(),
    clearConfirm: vi.fn(),
    confirmed: null,
  };
  const ui = (extra) => <Provider store={store}><PaymentPointSearcher {...props} {...extra} /></Provider>;
  const view = render(ui());
  // Stands in for any other dialog in the app being answered.
  const setConfirmed = (confirmed) => view.rerender(ui({ confirmed }));
  return { props, setConfirmed };
};

const clickDelete = () => fireEvent.click(screen.getByText('Delete').closest('button'));

describe('PaymentPointSearcher delete', () => {
  it('deletes once and greys the row when its own dialog is confirmed', () => {
    const { props } = renderSearcher();

    clickDelete();
    expect(props.deletePaymentPoint).not.toHaveBeenCalled();
    act(() => props.coreConfirm.mock.calls.at(-1)?.[2]?.onConfirm());

    expect(props.deletePaymentPoint).toHaveBeenCalledTimes(1);
    expect(props.deletePaymentPoint.mock.calls[0][0]).toEqual(ITEM);
    expect(screen.getByTestId('row-item-1').dataset.disabled).toBe('true');
  });

  it('does not delete when another dialog in the app is answered "Yes"', () => {
    const { props, setConfirmed } = renderSearcher();

    clickDelete();
    act(() => setConfirmed(true));

    expect(props.deletePaymentPoint).not.toHaveBeenCalled();
  });
});
