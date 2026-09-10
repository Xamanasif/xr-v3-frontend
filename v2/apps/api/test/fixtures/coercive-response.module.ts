/** Test-only route whose declared RESPONSE schema is coercive: the output direction must fail closed as well. */
import { Controller, Get, Module } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { z } from 'zod';

const coerciveResponse = z.object({ count: z.coerce.number() });

@Controller('__coercive-response')
export class CoerciveResponseController {
  @Get()
  @ApiOkResponse({ standardSchema: coerciveResponse })
  get(): { count: number } {
    return { count: 1 };
  }
}

@Module({ controllers: [CoerciveResponseController] })
export class CoerciveResponseModule {}
