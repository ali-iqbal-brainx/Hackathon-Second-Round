import { registerAs } from '@nestjs/config';

export default registerAs('openai', () => ({
  apiKey: process.env.API_KEY ?? '',
  model: process.env.MODEL ?? 'gpt-4o-mini',
}));
