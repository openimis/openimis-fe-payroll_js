export const parseJsonExt = (jsonExt) => {
  if (!jsonExt) return null;
  if (typeof jsonExt === 'object') return jsonExt;
  try {
    return JSON.parse(jsonExt);
  } catch {
    return null;
  }
};

/**
 * Generation progress as a percentage, or null when the payroll carries no
 * usable value. Callers render an indeterminate indicator on null rather than
 * a bar pinned at zero.
 */
export const getProgress = (jsonExt) => {
  const raw = Number(parseJsonExt(jsonExt)?.progress);
  if (!Number.isFinite(raw)) return null;
  return Math.min(100, Math.max(0, raw));
};
