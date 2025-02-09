export class AppError extends Error {
    public readonly code: string;
    public readonly message: string;
    public readonly isOperational: boolean;
  
    constructor(code: string, message: string, isOperational: boolean) {
      super(message);
  
      Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  
      this.code = code;
      this.message = message;
      this.isOperational = isOperational;
  
      Error.captureStackTrace(this);
    }
  }