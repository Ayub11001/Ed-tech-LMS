import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorEnvelopeDto } from '../../errors/error-envelope.dto';

const COMMON_ERROR_RESPONSES: Record<number, string> = {
  400: 'Validation failed or the request could not be processed',
  401: 'Missing, expired or invalid access token',
  403: 'Authenticated but not allowed to perform this action',
  404: 'The requested resource does not exist',
  409: 'The request conflicts with the current state of the resource',
  500: 'Unexpected server error',
};

/**
 * Documents the shared error envelope for every documented status code.
 * Pass overrides to tune (or remove) individual codes:
 * `{ 409: { description: '...' } }`, `{ 400: null }`.
 */
export function ApiErrorResponses(
  overrides: Record<number, string | null> = {},
): MethodDecorator & ClassDecorator {
  const responses: Record<number, string> = { ...COMMON_ERROR_RESPONSES };

  for (const [status, description] of Object.entries(overrides)) {
    if (description === null) {
      delete responses[Number(status)];
      continue;
    }
    responses[Number(status)] = description;
  }

  return applyDecorators(
    ...Object.entries(responses).map(([status, description]) =>
      ApiResponse({
        status: Number(status),
        description,
        type: ErrorEnvelopeDto,
      }),
    ),
  );
}
