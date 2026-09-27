/**
 * Wraps asynchronous Express route handlers to automatically catch
 * and pass errors to next() for centralized error middleware.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
