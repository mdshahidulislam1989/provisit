import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  imports: [ HttpModule],
  providers: [MailService],
  exports: [MailService], // 👈 export for DI
})
export class MailModule {}
