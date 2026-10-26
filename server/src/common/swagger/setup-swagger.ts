import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_UI_PATH = 'api/v1/docs';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Ed-tech LMS API')
    .setDescription(
      'REST API for the Ed-tech LMS: authentication, users, courses, enrollments, attendance and complaints.\n\n' +
        'Authenticate with either the `accessToken` cookie or an `Authorization: Bearer <jwt>` header.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token sent in the Authorization header',
      },
      'bearer',
    )
    .addCookieAuth(
      'accessToken',
      {
        type: 'apiKey',
        in: 'cookie',
        description: 'JWT access token sent as the accessToken cookie',
      },
      'cookie',
    )
    .addTag('auth', 'Registration, login, token refresh and logout')
    .addTag('users', 'User profile and account management')
    .addTag('courses', 'Course catalogue and educator ownership')
    .addTag('enrollments', 'Student enrollment lifecycle')
    .addTag('attendance', 'Attendance records per course')
    .addTag('complaints', 'Complaint intake and resolution')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_UI_PATH, app, document, {
    customSiteTitle: 'Ed-tech LMS API docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      tagsSorter: 'alpha',
      displayRequestDuration: true,
    },
  });
}
