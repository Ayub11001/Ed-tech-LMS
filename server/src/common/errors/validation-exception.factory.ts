import { ValidationError } from 'class-validator';
import { DomainException } from './domain.exceptions';
import { ErrorCodes } from './error-codes';

export function validationExceptionFactory(errors: ValidationError[]): never {
  const details = flattenValidationErrors(errors);

  throw new DomainException(
    ErrorCodes.VALIDATION_ERROR,
    400,
    'Validation Failed',
    details,
  );
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): { field: string; messages: string[] }[] {
  return errors.flatMap((error) => {
    const fieldPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const ownMessages = Object.values(error.constraints ?? {});
    const children = flattenValidationErrors(error.children ?? [], fieldPath);

    return [
      ...ownMessages.map((message) => ({
        field: fieldPath,
        messages: [message],
      })),
      ...children,
    ];
  });
}
