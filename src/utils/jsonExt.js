export const parseJsonExt = (jsonExt) => {
  if (!jsonExt) return null;
  if (typeof jsonExt === 'object') return jsonExt;
  try { return JSON.parse(jsonExt); } catch { return null; }
};

export const getProgress = (jsonExt) => {
  const ext = parseJsonExt(jsonExt);
  const raw = Number(ext?.progress);
  return Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
};
