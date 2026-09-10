/** Test-only route whose declared request schema carries a custom refinement that JSON Schema cannot express. */
import { Controller, Get, Module, Query } from '@nestjs/common';
import { z } from 'zod';

const refinedQuery = z.object({
  code: z.string().refine((value) => value !== 'forbidden', 'must not be forbidden'),
});

@Controller('__refined')
export class RefinedController {
  @Get()
  get(@Query({ schema: refinedQuery }) query: z.output<typeof refinedQuery>): { code: string } {
    return query;
  }
}

@Module({ controllers: [RefinedController] })
export class RefinedModule {}
