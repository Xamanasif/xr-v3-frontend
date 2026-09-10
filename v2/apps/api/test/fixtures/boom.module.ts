/** Test-only routes that fail on purpose, to prove the error boundary end to end. */
import { Controller, Get, InternalServerErrorException, Module } from '@nestjs/common';

export const INTERNAL_SECRET = 'connection to db.internal:5432 failed: password "hunter2" rejected';
export const PLAIN_SECRET = 'unexpected failure: token=sekret-123 host=10.0.0.9';

@Controller('__boom')
export class BoomController {
  @Get('http')
  http(): never {
    throw new InternalServerErrorException(INTERNAL_SECRET);
  }

  @Get('error')
  error(): never {
    throw new Error(PLAIN_SECRET);
  }
}

@Module({ controllers: [BoomController] })
export class BoomModule {}
