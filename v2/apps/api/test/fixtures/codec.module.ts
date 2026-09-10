/** Test-only route whose request schema is a codec: the conversion cannot be published faithfully. */
import { Controller, Get, Module, Query } from '@nestjs/common';
import { z } from 'zod';

const codecQuery = z.object({
  since: z.codec(z.iso.datetime({ offset: true }), z.date(), {
    decode: (value) => new Date(value),
    encode: (value) => value.toISOString(),
  }),
});

@Controller('__codec')
export class CodecController {
  @Get()
  get(@Query({ schema: codecQuery }) query: z.output<typeof codecQuery>): { since: string } {
    return { since: query.since.toISOString() };
  }
}

@Module({ controllers: [CodecController] })
export class CodecModule {}
