export const parseJsonExt = (jsonExt) => {
  if (!jsonExt) return null;
  if (typeof jsonExt === 'object') return jsonExt;
  try {
    return JSON.parse(jsonExt);
  } catch {
    return null;
  }
};

/** Generation progress clamped to 0-100, or null when json_ext carries no numeric progress. */
export const getProgress = (jsonExt) => {
  const value = parseJsonExt(jsonExt)?.progress;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (value === '') return null;
  const raw = Number(value);
  if (!Number.isFinite(raw)) return null;
  return Math.min(100, Math.max(0, raw));
};
