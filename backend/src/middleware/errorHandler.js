import { fail } from '../utils/helpers.js';

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.code === 'P2002') {
    return fail(res, 409, 'Duplicate value. This record already exists.');
  }
  if (err.code === 'P2025') {
    return fail(res, 404, 'Record not found.');
  }
  return fail(res, 500, err.message || 'Server error');
};

export const notFound = (req, res) => {
  return fail(res, 404, 'Route not found');
};
