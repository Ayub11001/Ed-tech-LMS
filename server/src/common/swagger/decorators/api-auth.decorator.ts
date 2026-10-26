import { applyDecorators } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';

/**
 * Marks a route as protected by the JWT access token.
 * The token may be sent either as the `accessToken` cookie or as
 * `Authorization: Bearer <token>`.
 */
export function ApiAuth(): MethodDecorator & ClassDecorator {
  return applyDecorators(ApiSecurity('bearer'), ApiSecurity('cookie'));
}
