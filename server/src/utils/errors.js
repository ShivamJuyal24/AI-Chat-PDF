/** Error that carries an HTTP status and is safe to show to the client. */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const notFoundError = () => new ApiError(404, 'Resource not found');
