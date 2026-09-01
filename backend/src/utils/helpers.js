export const ok = (res, data, pagination) => {
  const payload = { success: true, data };
  if (pagination) payload.pagination = pagination;
  return res.json(payload);
};

export const fail = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const getPagination = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPagination = (page, limit, total) => {
  return { page, limit, total, pages: Math.ceil(total / limit) };
};

export const toISODate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};
