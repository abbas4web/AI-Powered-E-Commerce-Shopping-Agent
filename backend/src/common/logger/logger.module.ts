import { Global, Module } from '@nestjs/common';
import { AppLogger } from './logger.service';

@Global()
@Module({
  providers: [
    {
      provide: AppLogger,
      useFactory: () => new AppLogger(),
    },
  ],
  exports: [AppLogger],
})
export class LoggerModule {}
