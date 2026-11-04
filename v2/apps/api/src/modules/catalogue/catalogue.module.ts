import { type DynamicModule, Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module.js';
import { PrismaService } from '../database/prisma.service.js';
import { CatalogueController } from './catalogue.controller.js';
import { CatalogueRepository, PrismaCatalogueRepository } from './catalogue.repository.js';
import { CatalogueReader } from './catalogue.service.js';

export interface CatalogueModuleOptions {
  /** The catalogue store; the D1 tables through Prisma unless given (integration tests). */
  repository?: CatalogueRepository;
}

/** D1 · the public catalogue (backend B1, ADR-0013). */
@Module({})
export class CatalogueModule {
  static register(options: CatalogueModuleOptions = {}): DynamicModule {
    return {
      module: CatalogueModule,
      imports: [DatabaseModule],
      controllers: [CatalogueController],
      providers: [
        CatalogueReader,
        options.repository
          ? { provide: CatalogueRepository, useValue: options.repository }
          : {
              provide: CatalogueRepository,
              inject: [PrismaService],
              useFactory: (prisma: PrismaService) =>
                new PrismaCatalogueRepository(() => prisma.getClient()),
            },
      ],
    };
  }
}
