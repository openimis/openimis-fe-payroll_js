import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';

vi.mock('@openimis/fe-core', () => ({ baseApiUrl: '/api' }));

const { parseJsonExt, getProgress } = await import('./jsonExt');
const { isBase64Encoded } = await import('./advanced-filters-utils');
const { default: downloadPayroll } = await import('./export');
const { globalId } = await import('@openimis/fe-core/testing');

describe('parseJsonExt', () => {
  it.each([
    ['a JSON string', '{"progress":40}'],
    ['an already parsed object', { progress: 40 }],
  ])('reads %s', (_label, jsonExt) => {
    expect(parseJsonExt(jsonExt)).toEqual({ progress: 40 });
  });

  it.each([
    ['null', null],
    ['an empty string', ''],
    ['malformed JSON', '{progress:'],
  ])('reads %s as null', (_label, jsonExt) => {
    expect(parseJsonExt(jsonExt)).toBeNull();
  });

  it('returns the object it was given rather than a copy', () => {
    const jsonExt = { progress: 40 };

    expect(parseJsonExt(jsonExt)).toBe(jsonExt);
  });
});

describe('getProgress', () => {
  it.each([
    ['a number', { progress: 42 }, 42],
    ['a numeric string', '{"progress":"42.5"}', 42.5],
    ['zero', { progress: 0 }, 0],
    ['a value above 100', { progress: 140 }, 100],
    ['a negative value', { progress: -5 }, 0],
  ])('reports %s as a percentage clamped to 0-100', (_label, jsonExt, expected) => {
    expect(getProgress(jsonExt)).toBe(expected);
  });

  it.each([
    ['no json_ext', null],
    ['no progress key', { other: 1 }],
    ['a null progress', { progress: null }],
    ['an empty string', { progress: '' }],
    ['a non-numeric string', { progress: 'half' }],
    ['a boolean', { progress: true }],
    ['an infinite value', { progress: 'Infinity' }],
    ['malformed JSON', '{progress:'],
  ])('reports unknown progress for %s', (_label, jsonExt) => {
    expect(getProgress(jsonExt)).toBeNull();
  });
});

describe('isBase64Encoded', () => {
  it('recognises a relay global id', () => {
    expect(isBase64Encoded(globalId('PayrollGQLType', '2f6d3a1e-7c4b-4e0a-9a51-0d3c8b7e6f12'))).toBe(true);
  });

  it.each([
    ['a hyphenated uuid', '2f6d3a1e-7c4b-4e0a-9a51-0d3c8b7e6f12'],
    ['an empty string', ''],
    ['text with spaces', 'not base64'],
  ])('rejects %s', (_label, value) => {
    expect(isBase64Encoded(value)).toBe(false);
  });
});

describe('downloadPayroll', () => {
  const response = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    blob: async () => new Blob([body]),
  });
  let clicked;

  const requestedUrl = () => new URL(fetch.mock.calls[0][0]);
  const settle = () => new Promise((resolve) => { setTimeout(resolve, 0); });

  beforeEach(() => {
    clicked = [];
    vi.stubGlobal('fetch', vi.fn(async () => response(200, 'id,amount\n1,10.00\n')));
    URL.createObjectURL = vi.fn(() => 'blob:payroll');
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
      clicked.push({ href: this.href, download: this.download, attached: document.body.contains(this) });
    });
  });

  afterEach(() => {
    delete URL.createObjectURL;
  });

  it('asks the reconciliation endpoint for the payroll by id and file name', () => {
    downloadPayroll('payroll-1', 'October');

    const url = requestedUrl();
    expect(url.pathname).toBe('/api/payroll/csv_reconciliation/');
    expect(url.searchParams.get('payroll_id')).toBe('payroll-1');
    expect(url.searchParams.get('payroll_file_name')).toBe('October');
  });

  it('asks for a blank reconciliation template by default', () => {
    downloadPayroll('payroll-1', 'October');

    expect(requestedUrl().searchParams.get('blank')).toBe('true');
  });

  it('asks for the uploaded file itself when not blank', () => {
    downloadPayroll('payroll-1', 'october-upload.csv', false);

    expect(requestedUrl().searchParams.get('blank')).toBe('false');
  });

  it('encodes a file name that contains URL syntax', () => {
    downloadPayroll('payroll-1', 'Oct & Nov #2');

    expect(requestedUrl().searchParams.get('payroll_file_name')).toBe('Oct & Nov #2');
  });

  it('saves a blank template as a named reconciliation csv', async () => {
    downloadPayroll('payroll-1', 'October');
    await settle();

    expect(clicked).toEqual([{ href: 'blob:payroll', download: 'reconciliation_October.csv', attached: true }]);
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('saves an uploaded file under its own name', async () => {
    downloadPayroll('payroll-1', 'october-upload.csv', false);
    await settle();

    expect(clicked[0].download).toBe('october-upload.csv');
  });

  it('logs rather than throws when the request cannot be made', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    downloadPayroll('payroll-1', 'October');
    await settle();

    expect(clicked).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith('Export failed, reason: ', expect.any(TypeError));
  });

  // Currently fails: the response status is never checked, so a 403 or 500 body is
  // turned into a blob and saved as reconciliation_<name>.csv as if it were
  // the payroll.
  it.fails('does not save an error response as the reconciliation file', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetch.mockResolvedValueOnce(response(403, '{"detail":"Forbidden"}'));

    downloadPayroll('payroll-1', 'October');
    await settle();

    expect(clicked).toEqual([]);
  });
});
