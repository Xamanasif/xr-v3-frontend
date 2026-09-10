/** Test-only route whose declared response schema cannot be expressed in JSON Schema. */
import { Controller, Get, Module } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { z } from 'zod';

const transformingResponse = z.object({ value: z.string().transform((value) => value.trim()) });

@Controller('__unrepresentable')
export class UnrepresentableController {
  @Get()
  @ApiOkResponse({ standardSchema: transformingResponse })
  get(): { value: string } {
    return { value: 'x' };
  }
}

@Module({ controllers: [UnrepresentableController] })
export class UnrepresentableModule {}
