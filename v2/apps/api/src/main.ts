import 'reflect-metadata';

import { Logger } from '@nestjs/common';

import { createApp } from './bootstrap.js';
import { ApiConfigService } from './config/config.service.js';
import { loadRootEnvFile } from './env-file.js';

async function main(): Promise<void> {
  const envFile = loadRootEnvFile();
  const app = await createApp({ requestLogging: true });
  const config = app.get(ApiConfigService);
  await app.listen(config.port, config.host);
  Logger.log(
    `API listening on http://${config.host}:${config.port}/api/v1 · env ${config.appEnv} · OpenAPI at /api/docs` +
      (envFile ? ` · loaded ${envFile}` : ' · no .env file loaded'),
    'Bootstrap',
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
