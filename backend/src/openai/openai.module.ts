import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: OpenAI,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('openai.apiKey');
        if (!apiKey?.trim()) {
          throw new Error(
            'OpenAI is not configured: set API_KEY in your environment.',
          );
        }
        return new OpenAI({ apiKey });
      },
      inject: [ConfigService],
    },
  ],
  exports: [OpenAI],
})
export class OpenAiModule {}
