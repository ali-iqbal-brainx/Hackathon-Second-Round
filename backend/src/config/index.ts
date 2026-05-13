import type { ConfigFactory } from '@nestjs/config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import openaiConfig from './openai.config';

export const configLoaders: ConfigFactory[] = [
  appConfig,
  databaseConfig,
  openaiConfig,
];

export { default as appConfig } from './app.config';
export { default as databaseConfig } from './database.config';
export { default as openaiConfig } from './openai.config';
