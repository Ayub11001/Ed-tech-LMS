import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { IncomingMessage } from 'node:http';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import {
  REQUEST_ID_HEADER,
  RequestMiddleware,
  SAFE_REQUEST_ID,
} from './common/middlewares/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId: (req: IncomingMessage) => {
          const inbound = req.headers[REQUEST_ID_HEADER];
          const candidate = Array.isArray(inbound) ? inbound[0] : inbound;
          return candidate && SAFE_REQUEST_ID.test(candidate)
            ? candidate
            : randomUUID();
        },
        redact: {
          paths: ['req.headers.cookie', 'req.headers.authorization'],
          censor: '[REDACTED]',
        },
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    CoursesModule,
    EnrollmentModule,
    AttendanceModule,
    ComplaintsModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestMiddleware).forRoutes('{*path}');
  }
}
