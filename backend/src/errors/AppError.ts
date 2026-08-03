
 //Error the application anticipates and can safely describe to the client like "Note not found" or "Invalid credentials"
 
 // anything thrown that is not an AppError is treated as an unexpected bug by global error handler and reported to the client as a generic 500
 
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}
