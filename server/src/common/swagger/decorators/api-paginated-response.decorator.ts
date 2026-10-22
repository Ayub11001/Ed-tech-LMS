import { applyDecorators } from '@nestjs/common';
import { Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../common/dto/paginated_response.dto';

/**
 * Documents a paginated response whose `data` array holds items of `model`.
 */
export function ApiPaginatedResponse(
  model: Type<unknown>,
  description = 'Paginated result set',
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
            required: ['data'],
          },
        ],
      },
    }),
  );
}
