import crypto from 'node:crypto';

/**
 * Request correlation / tracking ID middleware.
 * Reads incoming X-Request-ID or X-Correlation-ID headers,
 * or generates a new RFC 4122 v4 UUID if absent.
 */
export const correlationMiddleware = (req, res, next) => {
  const correlationId =
    req.headers['x-request-id'] ||
    req.headers['x-correlation-id'] ||
    crypto.randomUUID();

  // Attach to request object for downstream controllers and loggers
  req.id = correlationId;
  req.requestId = correlationId;
  req.correlationId = correlationId;

  // Set response headers for client tracking
  res.setHeader('X-Request-Id', correlationId);
  res.setHeader('X-Correlation-Id', correlationId);

  next();
};
