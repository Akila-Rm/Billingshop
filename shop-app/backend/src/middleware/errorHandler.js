/**
 * Central error handler middleware.
 * Catches errors thrown by route handlers and returns a consistent JSON error shape.
 */
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message || err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
