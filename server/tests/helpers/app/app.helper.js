/* eslint-disable import/no-extraneous-dependencies */
import { afterAll, beforeAll } from '@jest/globals';

import { App } from '../../../src/server.js';

const buildApp = () => {
  const { app } = new App({
    logger: false
  });

  beforeAll(async () => {
    await app.ready(() => {
      app.swagger();
    });
  });

  afterAll(async () => {
    await app.close();
  });

  return app;
};

export { buildApp };
