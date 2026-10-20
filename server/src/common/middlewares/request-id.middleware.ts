import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // pino-http already resolved req.id (from inbound header or generated) via genReqId
    const requestId = String((req as Request & { id?: string }).id ?? '');

    (req as Request & { requestId: string }).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
