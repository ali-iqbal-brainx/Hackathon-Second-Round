import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configLoaders } from './config/index.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BriefModule } from './modules/brief/brief.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { OpenAiModule } from './openai/openai.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: configLoaders,
    }),
    DatabaseModule,
    OpenAiModule,
    AuthModule,
    UsersModule,
    BriefModule,
  ],
})
export class AppModule {}
