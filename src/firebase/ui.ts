import { initializeUI } from '@firebase-oss/ui-core';
import { app } from './config';

export const ui = initializeUI({
  app,
});
