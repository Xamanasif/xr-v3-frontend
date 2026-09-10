import { createVitestConfig } from '@xr/testing';

export default createVitestConfig({
  environment: 'node',
  include: ['src/**/*.db.test.ts'],
  environmentDependent: true,
});
