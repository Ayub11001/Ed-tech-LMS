import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { Request, Response } from 'express';
import { DomainException } from './domain.exceptions';
import { ErrorCode, ErrorCodes } from './error-codes';
import { mapPrismaError } from './prisma-error.mapper';

type Envelope = {
  statusCode: number;
  error: ErrorCode;
  message: string;
  details?: unknown[];
  timestamp: string;
  path: string;
  requestId: string;
};

const STATUS_TO_CODE: Record<number, ErrorCode> = {
  [HttpStatus.BAD_REQUEST]: ErrorCodes.VALIDATION_ERROR,
  [HttpStatus.UNAUTHORIZED]: ErrorCodes.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCodes.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCodes.RESOURCE_NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCodes.CONFLICT,
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { requestId?: string }>();
    const res = ctx.getResponse<Response>();

    const { statusCode, code, message, details } = this.translate(
      exception,
      req.originalUrl,
    );
    const requestId = req.requestId ?? 'unknown';

    const envelope: Envelope = {
      statusCode,
      error: code,
      message,
      ...(details !== undefined && { details }),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      requestId,
    };

    if (statusCode >= 500) {
      this.logger.error({
        msg: exception instanceof Error ? exception.message : 'Unknown error',
        statusCode,
        error: code,
        method: req.method,
        path: req.originalUrl,
        requestId,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
      // Force generic message — internals never reach the client
      envelope.message = 'Internal server error';
      delete envelope.details;
    } else {
      this.logger.warn({
        msg: 'Request failed',
        statusCode,
        error: code,
        method: req.method,
        path: req.originalUrl,
        requestId,
      });
    }

    httpAdapter.reply(res, envelope, statusCode);
  }

  private translate(
    exception: unknown,
    path: string,
  ): {
    statusCode: number;
    code: ErrorCode;
    message: string;
    details?: unknown[];
  } {
    // 1. Already semantic — pass through untouched
    if (exception instanceof DomainException) {
      return {
        statusCode: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    // 2. Any other HttpException (guards, strategies, third-party) — derive a code from status
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      return {
        statusCode,
        code: this.codeForStatus(statusCode),
        message: exception.message,
      };
    }

    // 3. Known Prisma errors — translate via the pure mapper
    const prismaDomain = mapPrismaError(exception, path);
    if (prismaDomain) {
      return {
        statusCode: prismaDomain.getStatus(),
        code: prismaDomain.code,
        message: prismaDomain.message,
        details: prismaDomain.details,
      };
    }

    // 4. Unknown — a server bug or infrastructure failure
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'Internal server error',
    };
  }

  private codeForStatus(status: number): ErrorCode {
    return STATUS_TO_CODE[status] ?? ErrorCodes.INTERNAL_ERROR;
  }
}
