/** Test-only route whose request schema is the demonstrated pipeline: runtime enforces min(5), the document would not. */
import { Controller, Get, Module, Query } from '@nestjs/common';
import { z } from 'zod';

const pipelineQuery = z.object({ code: z.string().pipe(z.string().min(5)) });

@Controller('__pipeline')
export class PipelineController {
  @Get()
  get(@Query({ schema: pipelineQuery }) query: z.output<typeof pipelineQuery>): { code: string } {
    return query;
  }
}

@Module({ controllers: [PipelineController] })
export class PipelineModule {}
