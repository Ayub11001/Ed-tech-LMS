import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from './error-codes';

export class DomainException extends HttpException {
  private readonly errorCode: ErrorCode;
  private readonly errorDetails?: unknown[];
  constructor(
    code: ErrorCode,
    status: HttpStatus,
    message: string,
    details?: unknown[],
  ) {
    super(
      {
        code,
        message,
        ...(details !== undefined && { details }),
      },
      status,
    );
    this.errorCode = code;
    this.errorDetails = details;
  }
  get code(): ErrorCode {
    return this.errorCode;
  }
  get details(): unknown[] | undefined {
    return this.errorDetails;
  }
}
