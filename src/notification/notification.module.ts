import {HttpModule} from '@nestjs/axios';
import {Module} from '@nestjs/common';
import {NotificationService} from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [HttpModule],
  providers: [NotificationService],
  exports: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
