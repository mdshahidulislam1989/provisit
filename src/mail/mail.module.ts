import {HttpModule} from '@nestjs/axios';
import {Module} from '@nestjs/common';
import {GlobalConfig} from 'src/config';
import {MailService} from './mail.service';

@Module({
  imports: [GlobalConfig.mail, HttpModule],
  providers: [MailService],
  exports: [MailService], // 👈 export for DI
})
export class MailModule {}
