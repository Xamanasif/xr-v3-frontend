import { BadRequestException, type StandardSchemaValidationPipeOptions } from '@nestjs/common';

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

type StandardSchemaIssues = Parameters<
  NonNullable<StandardSchemaValidationPipeOptions['exceptionFactory']>
>[0];

/**
 * Raised by the framework's `StandardSchemaValidationPipe` through its
 * `exceptionFactory` hook, so a validation failure carries structured issues that
 * `ProblemDetailsFilter` renders as the RFC 9457 `errors` member.
 */
export class ValidationProblemException extends BadRequestException {
  constructor(readonly issues: readonly ValidationIssue[]) {
    super({ message: 'Validation failed', issues });
  }
}

export function validationExceptionFactory(
  issues: StandardSchemaIssues,
): ValidationProblemException {
  return new ValidationProblemException(
    issues.map((issue) => ({
      path:
        issue.path
          ?.map((segment) =>
            typeof segment === 'object' && segment !== null && 'key' in segment
              ? String(segment.key)
              : String(segment),
          )
          .join('.') || '(root)',
      message: issue.message,
    })),
  );
}
