/** Test-only route whose request schema is the demonstrated coercive query: documented number / boolean, would accept "7" / "false". */
import { Controller, Get, Module, Query } from '@nestjs/common';
import { z } from 'zod';

const coerciveQuery = z.object({ n: z.coerce.number(), flag: z.coerce.boolean() });

@Controller('__coercive')
export class CoerciveController {
  @Get()
  get(@Query({ schema: coerciveQuery }) query: z.output<typeof coerciveQuery>): {
    n: number;
    flag: boolean;
  } {
    return query;
  }
}

@Module({ controllers: [CoerciveController] })
export class CoerciveModule {}
