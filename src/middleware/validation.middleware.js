import { AppError } from '../utils/appError.js';

/**
 * Middleware factory to validate incoming requests against a Zod schema.
 *
 * @param {import('zod').ZodSchema | { body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema }} schema
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.post('/', validate(createUserSchema), userController.create);
 * // Or with segmented targets:
 * router.get('/:id', validate({ params: idParamSchema }), userController.getById);
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Check if schema has body/query/params sections or is a single schema for req.body
      if (schema.body || schema.query || schema.params) {
        if (schema.body) {
          req.body = await schema.body.parseAsync(req.body);
        }
        if (schema.query) {
          req.query = await schema.query.parseAsync(req.query);
        }
        if (schema.params) {
          req.params = await schema.params.parseAsync(req.params);
        }
      } else {
        req.body = await schema.parseAsync(req.body);
      }
      return next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        return next(AppError.unprocessable('Validation failed', formattedErrors));
      }
      return next(error);
    }
  };
};
