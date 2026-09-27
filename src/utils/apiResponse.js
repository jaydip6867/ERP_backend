/**
 * Standardized API response structure:
 * {
 *   success: true,
 *   message: "...",
 *   data: ...,
 *   meta: ...
 * }
 */
export class ApiResponse {
  constructor(data = null, message = 'Success', meta = null) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  /**
   * Send a successful HTTP response.
   *
   * @param {import('express').Response} res
   * @param {*} data
   * @param {string} [message='Success']
   * @param {number} [statusCode=200]
   * @param {object|null} [meta=null]
   */
  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const responseMeta = meta
      ? { requestId: res.req?.id, ...meta }
      : res.req?.id
      ? { requestId: res.req.id, timestamp: new Date().toISOString() }
      : null;

    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta: responseMeta,
    });
  }

  /**
   * Helper for 201 Created responses.
   */
  static created(res, data = null, message = 'Resource created successfully', meta = null) {
    return ApiResponse.success(res, data, message, 201, meta);
  }

  /**
   * Helper for paginated responses.
   */
  static paginated(res, data, pagination, message = 'Data retrieved successfully') {
    const meta = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNextPage: pagination.page * pagination.limit < pagination.total,
      hasPrevPage: pagination.page > 1,
    };
    return ApiResponse.success(res, data, message, 200, meta);
  }
}
